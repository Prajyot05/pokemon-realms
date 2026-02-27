import { Client, Room } from 'colyseus.js';
import { useGameStore } from '../../stores/useGameStore';
import { MessageType } from '@pokemon-realms/shared';
import type { Direction } from '@pokemon-realms/shared';

const SERVER_URL = 'ws://localhost:3001';

class NetworkManager {
  private client: Client;
  private room: Room | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

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

    // Try callback-based sync (may not work with reflected schemas)
    try {
      const state = this.room.state as any;
      if (state.players && typeof state.players.onAdd === 'function') {
        state.players.onAdd((player: any, sessionId: string) => {
          this.syncPlayer(sessionId, player);
          if (typeof player.onChange === 'function') {
            player.onChange(() => this.syncPlayer(sessionId, player));
          }
        });
        state.players.onRemove((_p: any, sessionId: string) => {
          useGameStore.getState().removePlayer(sessionId);
        });
      }
    } catch (e) {
      console.warn('Schema callbacks not available, using polling only', e);
    }

    // onStateChange as secondary sync
    this.room.onStateChange((roomState: any) => {
      this.syncAllPlayers(roomState);
    });

    // Polling as guaranteed fallback — reads room.state directly every frame
    this.pollInterval = setInterval(() => {
      if (this.room?.state) {
        this.syncAllPlayers(this.room.state as any);
      }
    }, 1000 / 30); // 30fps polling

    this.room.onLeave(() => {
      useGameStore.getState().setConnected(false);
      if (this.pollInterval) clearInterval(this.pollInterval);
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

  private syncAllPlayers(state: any) {
    if (!state.players) return;

    const store = useGameStore.getState();
    const seen = new Set<string>();

    // MapSchema.forEach or iterate entries
    const players = state.players;
    if (typeof players.forEach === 'function') {
      players.forEach((player: any, sessionId: string) => {
        seen.add(sessionId);
        store.setPlayer(sessionId, {
          id: sessionId,
          x: player.x,
          y: player.y,
          direction: player.direction,
        });
      });
    }

    // Remove players no longer in state
    for (const [id] of store.players) {
      if (!seen.has(id)) {
        store.removePlayer(id);
      }
    }
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
