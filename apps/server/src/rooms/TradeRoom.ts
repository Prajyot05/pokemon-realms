import { Room, Client } from '@colyseus/core';
import { TradeState, TradePlayerSchema, TradeMessage, TradeOffer } from '@pokemon-realms/shared';
import jwt from 'jsonwebtoken';
import { executeTrade } from '../db/queries/trade';
import { getUserParty, getUserPC } from '../db/queries/pokemon';
import { PokemonInstance } from '../pokemon/PokemonInstance';
import pokemonData from '@pokemon-realms/shared/src/data/pokemon.json';

export class TradeRoom extends Room<TradeState> {
  private p1Id: string | null = null;
  private p2Id: string | null = null;
  private isExecuting: boolean = false;

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
    this.setState(new TradeState());
    this.maxClients = 2;
    this.p1Id = options.p1Id;
    this.p2Id = options.p2Id;

    this.onMessage('TRADE_OFFER', async (client: Client, message: TradeOffer) => {
      if (this.state.phase !== 'SELECTING') return;
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      if (message.pokemonId !== null) {
        // Validate ownership and fetch details to display
        const userId = client.userData.userId;
        const party = await getUserParty(userId);
        const pc = await getUserPC(userId, 0); // Check box 0 for now
        const allOwned = [...party, ...pc];
        
        const pkm = allOwned.find(p => p.id === message.pokemonId);
        if (pkm) {
          player.offeredPokemonId = message.pokemonId;
          player.offeredPokemonData.id = pkm.id.toString();
          player.offeredPokemonData.speciesId = pkm.speciesId;
          player.offeredPokemonData.level = pkm.level;
          player.offeredPokemonData.isShiny = pkm.isShiny;
        }
      } else {
        player.offeredPokemonId = -1;
      }
      
      // Unready both players if offer changes
      this.state.players.forEach(p => p.isReady = false);
    });

    this.onMessage('TRADE_READY', (client: Client, message: { ready: boolean }) => {
      if (this.state.phase !== 'SELECTING' && this.state.phase !== 'READY') return;
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      if (message.ready && player.offeredPokemonId === -1) return; // Can't ready without offer
      
      player.isReady = message.ready;

      let allReady = true;
      let count = 0;
      this.state.players.forEach(p => {
        if (!p.isReady) allReady = false;
        count++;
      });

      if (count === 2 && allReady) {
        this.state.phase = 'CONFIRMING';
      } else {
        this.state.phase = 'SELECTING';
        this.state.players.forEach(p => p.isConfirmed = false); // reset confirms
      }
    });

    this.onMessage('TRADE_CONFIRM', async (client: Client) => {
      if (this.state.phase !== 'CONFIRMING') return;
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      player.isConfirmed = true;

      let allConfirmed = true;
      let count = 0;
      this.state.players.forEach(p => {
        if (!p.isConfirmed) allConfirmed = false;
        count++;
      });

      if (count === 2 && allConfirmed && !this.isExecuting) {
        this.isExecuting = true;
        
        const p1Client = this.clients.find(c => c.userData.userId.toString() === this.p1Id);
        const p2Client = this.clients.find(c => c.userData.userId.toString() === this.p2Id);
        
        if (p1Client && p2Client) {
          const p1 = this.state.players.get(p1Client.sessionId);
          const p2 = this.state.players.get(p2Client.sessionId);
          
          if (p1 && p2 && p1.offeredPokemonId !== -1 && p2.offeredPokemonId !== -1) {
            const success = await executeTrade(
              p1Client.userData.userId, p1.offeredPokemonId,
              p2Client.userData.userId, p2.offeredPokemonId
            );
            
            if (success) {
              this.state.phase = 'COMPLETED';
              this.broadcast('TRADE_COMPLETED');
            } else {
              this.state.phase = 'CANCELLED';
              this.broadcast('TRADE_CANCELLED', { reason: 'Trade execution failed.' });
            }
          }
        }
        
        this.clock.setTimeout(() => this.disconnect(), 3000);
      }
    });

    this.onMessage('TRADE_CANCEL', (client: Client) => {
      this.state.phase = 'CANCELLED';
      this.broadcast('TRADE_CANCELLED', { reason: 'Player cancelled.' });
      this.clock.setTimeout(() => this.disconnect(), 1000);
    });
  }

  onJoin(client: Client, options: any) {
    const player = new TradePlayerSchema();
    player.id = client.userData.userId.toString();
    player.name = options.username || `Player ${player.id}`;
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client) {
    if (this.state.phase !== 'COMPLETED' && this.state.phase !== 'CANCELLED') {
      this.state.phase = 'CANCELLED';
      this.broadcast('TRADE_CANCELLED', { reason: 'Player disconnected.' });
      this.disconnect();
    }
  }
}
