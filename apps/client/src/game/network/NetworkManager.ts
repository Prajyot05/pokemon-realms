import { Client, Room } from 'colyseus.js';
import { useGameStore } from '../../stores/useGameStore';
import { MessageType } from '@pokemon-realms/shared';
import type { Direction } from '@pokemon-realms/shared';

import { WorldState } from '@pokemon-realms/shared';

const SERVER_URL = 'ws://localhost:3001';

class NetworkManager {
  private client: Client;
  private room: Room<WorldState> | null = null;

  constructor() {
    this.client = new Client(SERVER_URL);
  }

  async connect(mapId: string = 'pallet-town'): Promise<Room<WorldState>> {
    this.room = await this.client.joinOrCreate<WorldState>('zone', { mapId }, WorldState);

    useGameStore.getState().setConnected(true, this.room.sessionId);
    console.log(`🔗 Connected as ${this.room.sessionId}`);

    // Log any errors
    this.room.onError((code, message) => {
      console.error(`Room error [${code}]:`, message);
    });

    // Listen for players added (this automatically triggers for existing players too!)
    if (this.room.state.players) {
      this.room.state.players.onAdd((player, sessionId: string) => {
        console.log(`✅ Player added via onAdd: ${sessionId}`, player);
        useGameStore.getState().setPlayer(sessionId, {
          id: sessionId,
          x: player.x,
          y: player.y,
          direction: player.direction as any, // Cast to any to avoid strict direction typing issues
        });

        // Also listen for changes to this specific player (position, direction)
        player.listen('x', () => {
          useGameStore.getState().setPlayer(sessionId, {
            id: sessionId,
            x: player.x,
            y: player.y,
            direction: player.direction as any,
          });
        });
        player.listen('y', () => {
          useGameStore.getState().setPlayer(sessionId, {
            id: sessionId,
            x: player.x,
            y: player.y,
            direction: player.direction as any,
          });
        });
        player.listen('direction', () => {
          useGameStore.getState().setPlayer(sessionId, {
            id: sessionId,
            x: player.x,
            y: player.y,
            direction: player.direction as any,
          });
        });
      });

      this.room.state.players.onRemove((player, sessionId: string) => {
        console.log(`👋 Player removed via onRemove: ${sessionId}`);
        useGameStore.getState().removePlayer(sessionId);
      });

      console.log('Room State:', this.room.state);
      console.log('Players in state:', this.room.state.players, 'Size:', this.room.state.players?.size);

      // Initialize players already present in the room state
      this.room.state.players.forEach((player, sessionId: string) => {
        console.log(`✅ Player initialized from state: ${sessionId}`, player);
        useGameStore.getState().setPlayer(sessionId, {
          id: sessionId,
          x: player.x,
          y: player.y,
          direction: player.direction as any,
        });

        player.listen('x', () => {
          useGameStore.getState().setPlayer(sessionId, {
            id: sessionId,
            x: player.x,
            y: player.y,
            direction: player.direction as any,
          });
        });
        player.listen('y', () => {
          useGameStore.getState().setPlayer(sessionId, {
            id: sessionId,
            x: player.x,
            y: player.y,
            direction: player.direction as any,
          });
        });
        player.listen('direction', () => {
          useGameStore.getState().setPlayer(sessionId, {
            id: sessionId,
            x: player.x,
            y: player.y,
            direction: player.direction as any,
          });
        });
      });
    }

    // Fallback onStateChange
    this.room.onStateChange((state: any) => {
      console.log('🔄 onStateChange fired');
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

  sendStop() {
    this.room?.send('STOP');
  }

  getSessionId(): string | null {
    return this.room?.sessionId ?? null;
  }
}

// Singleton
export const networkManager = new NetworkManager();
