import { Client, Room } from 'colyseus.js';
import { useGameStore } from '../../stores/useGameStore';
import { MessageType } from '@pokemon-realms/shared';
import type { Direction } from '@pokemon-realms/shared';

const SERVER_URL = 'ws://localhost:3001';

class NetworkManager {
  private client: Client;
  private room: Room | null = null;

  constructor() {
    this.client = new Client(SERVER_URL);
  }

  async connect(): Promise<Room> {
    this.room = await this.client.joinOrCreate('world');

    useGameStore.getState().setConnected(true, this.room.sessionId);
    console.log(`🔗 Connected as ${this.room.sessionId}`);

    // Log any errors
    this.room.onError((code, message) => {
      console.error(`Room error [${code}]:`, message);
    });

    this.room.onStateChange((state: any) => {
      if (!state.players) return;
      const store = useGameStore.getState();
      const seen = new Set<string>();

      state.players.forEach((player: any, sessionId: string) => {
        seen.add(sessionId);
        store.setPlayer(sessionId, {
          id: sessionId,
          x: player.x,
          y: player.y,
          direction: player.direction,
        });
      });

      for (const [id] of store.players) {
        if (!seen.has(id)) {
          store.removePlayer(id);
        }
      }
    });

    this.room.onLeave(() => {
      useGameStore.getState().setConnected(false);
      console.log('🔌 Disconnected from server');
    });

    return this.room;
  }

  sendMove(direction: Direction) {
    this.room?.send(MessageType.MOVE, { direction });
  }

  getSessionId(): string | null {
    return this.room?.sessionId ?? null;
  }
}

// Singleton
export const networkManager = new NetworkManager();
