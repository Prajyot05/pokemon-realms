import { create } from 'zustand';
import type { PlayerState } from '@pokemon-realms/shared';

interface GameStore {
  connected: boolean;
  playerId: string | null;
  players: Map<string, PlayerState>;

  setConnected: (connected: boolean, playerId?: string) => void;
  setPlayer: (id: string, state: PlayerState) => void;
  removePlayer: (id: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  connected: false,
  playerId: null,
  players: new Map(),

  setConnected: (connected, playerId) =>
    set({ connected, playerId: playerId ?? null }),

  setPlayer: (id, state) =>
    set((prev) => {
      const next = new Map(prev.players);
      next.set(id, state);
      return { players: next };
    }),

  removePlayer: (id) =>
    set((prev) => {
      const next = new Map(prev.players);
      next.delete(id);
      return { players: next };
    }),
}));
