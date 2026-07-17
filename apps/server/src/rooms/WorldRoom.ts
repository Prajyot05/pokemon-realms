import { Room, Client } from 'colyseus';
import { WorldState, PlayerSchema } from '@pokemon-realms/shared';
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

