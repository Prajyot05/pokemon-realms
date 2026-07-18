import { Room, Client } from 'colyseus';
import { WorldState, PlayerSchema, NPCSchema } from '@pokemon-realms/shared';
import { MOVE_SPEED, MessageType } from '@pokemon-realms/shared';
import type { MoveMessage, Direction } from '@pokemon-realms/shared';
import { mapManager } from '../maps/MapManager';
import { EncounterManager } from '../encounters/EncounterManager';
import jwt from 'jsonwebtoken';
import { getUserParty, getUserPC } from '../db/queries/pokemon';
import { matchMaker } from 'colyseus';
import { ChatManager } from '../chat/ChatManager';
import { SendChatMessage } from '@pokemon-realms/shared';

const VALID_DIRECTIONS = new Set<Direction>(['up', 'down', 'left', 'right']);

export class WorldRoom extends Room<WorldState> {
  private mapCollision!: ReturnType<typeof mapManager.loadMap>;
  private mapId: string = 'pallet-town';
  private playerTiles: Map<string, { x: number, y: number }> = new Map();
  private playersInBattle: Set<string> = new Set();
  private chatManager: ChatManager = new ChatManager();

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

  onCreate(options: { mapId: string }) {
    this.mapId = options.mapId || 'pallet-town';
    this.mapCollision = mapManager.loadMap(this.mapId);

    this.setState(new WorldState());
    
    // Spawn a dummy NPC for testing (Professor Oak)
    const oak = new NPCSchema();
    oak.id = 'npc_oak_1';
    oak.x = 400;
    oak.y = 200; // Place above player spawn
    oak.direction = 'down';
    oak.sprite = 'npc 01'; // Uses npc 01.png
    this.state.npcs.set(oak.id, oak);

    this.setSimulationInterval(() => this.update(), 1000 / 60);

    this.onMessage(MessageType.MOVE, (client: Client, message: MoveMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      if (!VALID_DIRECTIONS.has(message.direction)) return;
      player.direction = message.direction;
      player.isMoving = true;
    });
    
    // We add a STOP message for when the user releases the key
    this.onMessage('STOP', (client: Client) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.isMoving = false;
      }
    });

    this.onMessage('FETCH_PARTY', async (client: Client) => {
      const userId = client.userData?.userId;
      if (!userId) return;
      try {
        const party = await getUserParty(userId);
        client.send('PARTY_DATA', party);
      } catch (e) {
        console.error('Failed to fetch party:', e);
      }
    });

    this.onMessage('BATTLE_ENDED', (client: Client) => {
      this.playersInBattle.delete(client.sessionId);
    });

    this.onMessage('FETCH_PC', async (client: Client, message: { boxNumber?: number }) => {
      const userId = client.userData?.userId;
      if (!userId) return;
      try {
        const boxNumber = message?.boxNumber || 0;
        const pc = await getUserPC(userId, boxNumber);
        client.send('PC_DATA', { boxNumber, data: pc });
      } catch (e) {
        console.error('Failed to fetch PC:', e);
      }
    });

    this.onMessage('CHAT_MESSAGE', (client: Client, message: SendChatMessage) => {
      this.chatManager.processMessage(client, this, message);
    });

    this.onMessage('FETCH_CHAT_HISTORY', (client: Client) => {
      this.chatManager.sendHistory(client);
    });

    this.onMessage(MessageType.INTERACT, (client: Client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      // Calculate the tile exactly in front of the player
      let targetX = player.x;
      let targetY = player.y;

      // Check if any NPC is in front of the player using a directional bounding box
      this.state.npcs.forEach((npc) => {
        let isFacingNPC = false;
        
        const dx = npc.x - player.x;
        const dy = npc.y - player.y;

        // Allow a small "wiggle room" of 20 pixels on the perpendicular axis
        const alignThreshold = 24; 
        // How far they can reach in the facing direction (1.5 tiles)
        const reachThreshold = 48; 
        
        switch (player.direction) {
          case 'up':
            if (dy < 0 && dy > -reachThreshold && Math.abs(dx) < alignThreshold) isFacingNPC = true;
            break;
          case 'down':
            if (dy > 0 && dy < reachThreshold && Math.abs(dx) < alignThreshold) isFacingNPC = true;
            break;
          case 'left':
            if (dx < 0 && dx > -reachThreshold && Math.abs(dy) < alignThreshold) isFacingNPC = true;
            break;
          case 'right':
            if (dx > 0 && dx < reachThreshold && Math.abs(dy) < alignThreshold) isFacingNPC = true;
            break;
        }
        
        if (isFacingNPC) {
          // NPC found! Make them face the player
          switch (player.direction) {
            case 'up': npc.direction = 'down'; break;
            case 'down': npc.direction = 'up'; break;
            case 'left': npc.direction = 'right'; break;
            case 'right': npc.direction = 'left'; break;
          }
          
          // Send dialog directly to the client who interacted
          client.send(MessageType.DIALOG, {
            npcId: npc.id,
            text: "Hello there! Welcome to the world of POKEMON! My name is OAK! People call me the POKEMON PROF! This world is inhabited by creatures called POKEMON!"
          });
        }
      });

      // Also check if facing a player
      this.state.players.forEach((otherPlayer, sessionId) => {
        if (sessionId === client.sessionId) return;
        
        let isFacingPlayer = false;
        const dx = otherPlayer.x - player.x;
        const dy = otherPlayer.y - player.y;

        const alignThreshold = 24; 
        const reachThreshold = 48; 
        
        switch (player.direction) {
          case 'up': if (dy < 0 && dy > -reachThreshold && Math.abs(dx) < alignThreshold) isFacingPlayer = true; break;
          case 'down': if (dy > 0 && dy < reachThreshold && Math.abs(dx) < alignThreshold) isFacingPlayer = true; break;
          case 'left': if (dx < 0 && dx > -reachThreshold && Math.abs(dy) < alignThreshold) isFacingPlayer = true; break;
          case 'right': if (dx > 0 && dx < reachThreshold && Math.abs(dy) < alignThreshold) isFacingPlayer = true; break;
        }

        if (isFacingPlayer) {
          const otherClient = this.clients.find(c => c.sessionId === sessionId);
          if (otherClient) {
            // Send challenge prompt to the other player
            otherClient.send('CHALLENGE_REQUEST', {
              fromPlayerId: client.userData.userId,
              fromUsername: player.id // Using session ID as name fallback for now
            });
          }
        }
      });
    });

    this.onMessage('ACCEPT_CHALLENGE', async (client: Client, message: { fromPlayerId: number }) => {
      const p1Id = client.userData.userId;
      const p2Id = message.fromPlayerId;

      const p1Client = client;
      const p2Client = this.clients.find(c => c.userData?.userId === p2Id);

      if (p2Client) {
        // Create BattleRoom
        const room = await matchMaker.createRoom('battle', {
          isPvE: false,
          p1Id: p1Id.toString(),
          p2Id: p2Id.toString()
        });

        p1Client.send('BATTLE_START', { roomId: room.roomId });
        p2Client.send('BATTLE_START', { roomId: room.roomId });
      }
    });

    console.log(`🌍 Zone created: ${this.mapId}`);
  }

  onJoin(client: Client) {
    const player = new PlayerSchema();
    player.id = client.sessionId;
    // Spawn at center
    player.x = 400;
    player.y = 300;
    this.state.players.set(client.sessionId, player);
    this.playerTiles.set(client.sessionId, { x: Math.floor(400/32), y: Math.floor(300/32) });
    console.log(`✅ Player joined: ${client.sessionId}`);
  }

  onLeave(client: Client) {
    console.log('👋 Player left:', client.sessionId);
    this.playerTiles.delete(client.sessionId);
    this.playersInBattle.delete(client.sessionId);
    this.state.players.delete(client.sessionId);
  }

  update() {
    this.state.players.forEach((player) => {
      if (!player.isMoving) return;

      let nextX = player.x;
      let nextY = player.y;

      switch (player.direction) {
        case 'up': nextY -= MOVE_SPEED; break;
        case 'down': nextY += MOVE_SPEED; break;
        case 'left': nextX -= MOVE_SPEED; break;
        case 'right': nextX += MOVE_SPEED; break;
      }

      // Check collision (using center of the tile, assume player size is 32x32)
      // Tile coordinates are (x / 32), (y / 32)
      const tileX = Math.floor(nextX / 32);
      const tileY = Math.floor(nextY / 32);

      if (this.mapCollision.isWalkable(tileX, tileY)) {
        player.x = nextX;
        player.y = nextY;
        
        // Encounter stub logic
        const lastTile = this.playerTiles.get(player.id);
        if (lastTile && (lastTile.x !== tileX || lastTile.y !== tileY)) {
          this.playerTiles.set(player.id, { x: tileX, y: tileY });
          if (this.playersInBattle.has(player.id)) return;

          // Only roll on grass (stub: random chance on any walk for now)
          const client = this.clients.find((c) => c.sessionId === player.id);
          const userId = client?.userData?.userId;
          if (userId) {
            this.playersInBattle.add(player.id);
            EncounterManager.rollEncounter(this.mapId, userId).then(async (wildInstance) => {
              if (wildInstance) {
                player.isMoving = false;
                
                // Create BattleRoom on server side
                const room = await matchMaker.createRoom('battle', {
                  isPvE: true,
                  p1Id: userId.toString(),
                  p2Id: 'WILD',
                  wildInstance: wildInstance
                });
                
                // Tell client to join this specific room
                client.send('BATTLE_START', { roomId: room.roomId });
              } else {
                this.playersInBattle.delete(player.id);
              }
            }).catch(err => {
              console.error(err);
              this.playersInBattle.delete(player.id);
            });
          }
        }
      }
    });
  }

  onDispose() {
    console.log('🗑️ WorldRoom disposed');
  }
}

