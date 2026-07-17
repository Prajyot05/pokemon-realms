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

  async connect(mapId: string = 'pallet-town'): Promise<Room> {
    this.room = await this.client.joinOrCreate('zone', { mapId });

    useGameStore.getState().setConnected(true, this.room.sessionId);
    console.log(`🔗 Connected as ${this.room.sessionId}`);

    // Log any errors
    this.room.onError((code, message) => {
      console.error(`Room error [${code}]:`, message);
    });

    // Sync the INITIAL state immediately — onStateChange does NOT fire for
    // the state that is already present at join time.
    this.syncFromState(this.room.state);

    // Sync on every subsequent state patch from the server
    this.room.onStateChange((state: any) => {
      this.syncFromState(state);
    });

    this.room.onLeave(() => {
      useGameStore.getState().setConnected(false);
      console.log('🔌 Disconnected from server');
    });

    return this.room;
  }

  /** Read all players from Colyseus state and push into Zustand store */
  private syncFromState(state: any) {
    if (!state?.players) return;
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

    // Remove players that are no longer in server state
    for (const [id] of store.players) {
      if (!seen.has(id)) {
        store.removePlayer(id);
      }
    }
  }

  sendMove(direction: Direction) {
    this.room?.send(MessageType.MOVE, { direction });
  }

  sendStop() {
    this.room?.send('STOP');
  }

  getSessionId(): string | null {
    return this.room?.sessionId ?? null;
  }
}

// Singleton
export const networkManager = new NetworkManager();
