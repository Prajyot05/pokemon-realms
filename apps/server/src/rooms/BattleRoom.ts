import { Room, Client } from '@colyseus/core';
import { BattleState, BattlePlayerSchema, BattlePokemonSchema, BattleAction, TurnResult } from '@pokemon-realms/shared';
import { BattleEngine } from '../battle/BattleEngine';
import { PokemonInstance } from '../pokemon/PokemonInstance';
import { getUserParty } from '../db/queries/pokemon';
import pokemonData from '@pokemon-realms/shared/src/data/pokemon.json';
import { calculateAllStats } from '../pokemon/genetics';
import jwt from 'jsonwebtoken';

export class BattleRoom extends Room<BattleState> {
  private playerInstances: Map<string, PokemonInstance[]> = new Map();
  private p1Id: string | null = null;
  private p2Id: string | null = null;
  
  private actionsThisTurn: Map<string, BattleAction> = new Map();

  private isPvE: boolean = false;
  private wildInstanceObj: PokemonInstance | null = null;

  async onAuth(client: Client, options: any, request: any) {
    const token = options.token;
    if (!token) throw new Error('Missing token');

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-pokemon-key-for-dev') as any;
      client.userData = { userId: decoded.userId };
      return true;
    } catch (e) {
      throw new Error('Invalid token');
    }
  }

  async onCreate(options: any) {
    this.setState(new BattleState());
    this.maxClients = 100; // 2 players + 98 spectators

    this.isPvE = options.isPvE || false;

    this.p1Id = options.p1Id;
    this.p2Id = options.p2Id; // In PvE, this is 'WILD'
    this.wildInstanceObj = options.wildInstance || null;

    this.onMessage('BATTLE_ACTION', (client, action: BattleAction) => {
      if (this.state.phase !== 'WAITING_FOR_ACTIONS') return;

      const playerId = client.userData.userId.toString();
      
      if (playerId !== this.p1Id && playerId !== this.p2Id) return;

      this.actionsThisTurn.set(playerId, action);

      this.checkTurnReady();
    });
  }

  async onJoin(client: Client, options: any) {
    if (!client.userData) client.userData = {};
    if (options.isSpectator) {
      this.state.spectatorCount++;
      client.userData.isSpectator = true;
      return;
    }

    client.userData.isSpectator = false;
    const userId = client.userData.userId;
    const playerId = userId.toString();

    // In PvE, wild pokemon connects? No, server simulates it.
    if (this.isPvE && playerId === 'WILD') {
       // Should not happen via client
       return;
    }

    const party = await getUserParty(userId);
    const instances = party.map(p => new PokemonInstance(p as any));
    this.playerInstances.set(playerId, instances);

    const playerSchema = new BattlePlayerSchema();
    playerSchema.id = playerId;
    playerSchema.name = options.username || `Player ${playerId}`;

    const activeInstance = instances.find(p => p.data.currentHp > 0) || instances[0];
    
    playerSchema.activePokemon.id = activeInstance.data.id.toString();
    playerSchema.activePokemon.speciesId = activeInstance.data.speciesId;
    playerSchema.activePokemon.level = activeInstance.data.level;
    
    const stats = calculateAllStats(activeInstance.data.speciesId, activeInstance.data.level, activeInstance.data.ivs, activeInstance.data.evs, activeInstance.data.nature);
    playerSchema.activePokemon.maxHp = stats.hp;
    playerSchema.activePokemon.currentHp = activeInstance.data.currentHp;
    playerSchema.activePokemon.isShiny = activeInstance.data.isShiny;

    this.state.players.set(playerId, playerSchema);

    if (this.isPvE && !this.state.players.has('WILD')) {
      // Simulate Wild joining
      const wildInstance = this.wildInstanceObj;
      if (wildInstance) {
        this.playerInstances.set('WILD', [wildInstance]);
      
        const wildSchema = new BattlePlayerSchema();
        wildSchema.id = 'WILD';
        wildSchema.name = 'Wild ' + ((pokemonData as any)[wildInstance.data.speciesId].Name);
      
        wildSchema.activePokemon.id = wildInstance.data.id.toString();
        wildSchema.activePokemon.speciesId = wildInstance.data.speciesId;
        wildSchema.activePokemon.level = wildInstance.data.level;
      
        const wildStats = calculateAllStats(wildInstance.data.speciesId, wildInstance.data.level, wildInstance.data.ivs, wildInstance.data.evs, wildInstance.data.nature);
        wildSchema.activePokemon.maxHp = wildStats.hp;
        wildSchema.activePokemon.currentHp = wildInstance.data.currentHp;
        wildSchema.activePokemon.isShiny = wildInstance.data.isShiny;
        
        this.state.players.set('WILD', wildSchema);
      }
    }
  }

  async checkTurnReady() {
    try {
      console.log(`[BattleRoom] checkTurnReady called. p1Id: ${this.p1Id}, p2Id: ${this.p2Id}`);
      console.log(`[BattleRoom] actionsThisTurn keys:`, Array.from(this.actionsThisTurn.keys()));

      if (this.isPvE && this.actionsThisTurn.has(this.p1Id!)) {
        const wildInstance = this.playerInstances.get('WILD')![0];
        const moves = wildInstance.data.moves;
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        
        console.log(`[BattleRoom] Generating WILD action: ${randomMove}`);
        this.actionsThisTurn.set('WILD', {
          playerId: 'WILD',
          type: 'FIGHT',
          moveId: randomMove
        });
      }

      console.log(`[BattleRoom] After PvE check. actionsThisTurn keys:`, Array.from(this.actionsThisTurn.keys()));

      if (this.actionsThisTurn.has(this.p1Id!) && this.actionsThisTurn.has(this.p2Id!)) {
        console.log(`[BattleRoom] Both players ready! Resolving turn...`);
        this.state.phase = 'RESOLVING_TURN';
        
        const p1Action = this.actionsThisTurn.get(this.p1Id!)!;
        const p2Action = this.actionsThisTurn.get(this.p2Id!)!;

        const p1Instance = this.playerInstances.get(this.p1Id!)!.find(p => p.data.id.toString() === this.state.players.get(this.p1Id!)!.activePokemon.id)!;
        const p2Instance = this.playerInstances.get(this.p2Id!)!.find(p => p.data.id.toString() === this.state.players.get(this.p2Id!)!.activePokemon.id)!;

        const turnResult = await BattleEngine.resolveTurn(
          this.state.turn,
          { id: this.p1Id!, instance: p1Instance, action: p1Action, schema: this.state.players.get(this.p1Id!)!.activePokemon },
          { id: this.p2Id!, instance: p2Instance, action: p2Action, schema: this.state.players.get(this.p2Id!)!.activePokemon }
        );

        this.broadcast('BATTLE_TURN_RESULT', turnResult);

        // Apply results to schemas
        this.state.players.get(this.p1Id!)!.activePokemon.currentHp = p1Instance.data.currentHp;
        this.state.players.get(this.p2Id!)!.activePokemon.currentHp = p2Instance.data.currentHp;

        this.actionsThisTurn.clear();
        this.state.turn++;
        
        if (turnResult.isBattleEnded || p1Instance.data.currentHp <= 0 || p2Instance.data.currentHp <= 0) {
          this.state.phase = 'BATTLE_END';
          setTimeout(() => {
            this.disconnect();
          }, 5000);
        } else {
          this.state.phase = 'WAITING_FOR_ACTIONS';
        }
      }
    } catch (err) {
      console.error('[BattleRoom] Error in checkTurnReady:', err);
    }
  }

  onLeave(client: Client) {
    if (client.userData?.isSpectator) {
      this.state.spectatorCount--;
    } else {
      if (this.state.phase !== 'BATTLE_END') {
        this.state.phase = 'BATTLE_END';
        this.broadcast('BATTLE_END', { winner: client.userData?.userId?.toString() === this.p1Id ? this.p2Id : this.p1Id });
        this.disconnect();
      }
    }
  }
}
