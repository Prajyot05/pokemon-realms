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

    const state = this.room.state as any;
    state.players.onAdd((player: any, sessionId: string) => {
      this.syncPlayer(sessionId, player);
      player.onChange(() => this.syncPlayer(sessionId, player));
    });

    state.players.onRemove((_p: any, sessionId: string) => {
      useGameStore.getState().removePlayer(sessionId);
    });

    this.room.onLeave(() => {
      useGameStore.getState().setConnected(false);
      console.log('🔌 Disconnected from server');
    });

    return this.room;
  }

  private syncPlayer(sessionId: string, player: any) {
    useGameStore.getState().setPlayer(sessionId, {
      id: sessionId,
      x: player.x,
      y: player.y,
      direction: player.direction,
    });
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
