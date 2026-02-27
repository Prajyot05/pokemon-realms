import { Room, Client } from 'colyseus';
import { WorldState, PlayerSchema } from '../schemas/PlayerSchema';
import { MOVE_SPEED, GAME_WIDTH, GAME_HEIGHT, MessageType } from '@pokemon-realms/shared';
import type { MoveMessage, Direction } from '@pokemon-realms/shared';

const VALID_DIRECTIONS = new Set<Direction>(['up', 'down', 'left', 'right']);

export class WorldRoom extends Room<WorldState> {
  onCreate() {
    this.setState(new WorldState());
    this.setSimulationInterval(() => this.update(), 1000 / 60);

    this.onMessage(MessageType.MOVE, (client: Client, message: MoveMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      // Validate direction to prevent injection of arbitrary values
      if (!VALID_DIRECTIONS.has(message.direction)) return;

      player.direction = message.direction;

      // Server-authoritative position update
      switch (message.direction) {
        case 'up':
          player.y = Math.max(0, player.y - MOVE_SPEED);
          break;
        case 'down':
          player.y = Math.min(GAME_HEIGHT - 32, player.y + MOVE_SPEED);
          break;
        case 'left':
          player.x = Math.max(0, player.x - MOVE_SPEED);
          break;
        case 'right':
          player.x = Math.min(GAME_WIDTH - 32, player.x + MOVE_SPEED);
          break;
      }
    });

    console.log('🌍 WorldRoom created');
  }

  onJoin(client: Client) {
    const player = new PlayerSchema();
    player.id = client.sessionId;
    // Spawn at center
    player.x = GAME_WIDTH / 2;
    player.y = GAME_HEIGHT / 2;
    this.state.players.set(client.sessionId, player);
    console.log(`✅ Player joined: ${client.sessionId}`);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    console.log(`👋 Player left: ${client.sessionId}`);
  }

  update() {
    // Future: NPC AI, physics, collision detection
  }

  onDispose() {
    console.log('🗑️ WorldRoom disposed');
  }
}
