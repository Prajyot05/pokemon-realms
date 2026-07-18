import { Room, Client } from 'colyseus';
import { WorldState, PlayerSchema, NPCSchema } from '@pokemon-realms/shared';
import { MOVE_SPEED, MessageType } from '@pokemon-realms/shared';
import type { MoveMessage, Direction } from '@pokemon-realms/shared';
import { mapManager } from '../maps/MapManager';

const VALID_DIRECTIONS = new Set<Direction>(['up', 'down', 'left', 'right']);

export class WorldRoom extends Room<WorldState> {
  private mapCollision!: ReturnType<typeof mapManager.loadMap>;
  private mapId!: string;

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
    console.log(`✅ Player joined: ${client.sessionId}`);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    console.log(`👋 Player left: ${client.sessionId}`);
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
      }
    });
  }

  onDispose() {
    console.log('🗑️ WorldRoom disposed');
  }
}

