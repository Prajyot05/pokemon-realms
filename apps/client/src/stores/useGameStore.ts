import { create } from 'zustand';

interface GameStore {
  connected: boolean;
  playerCount: number;
  playerId: string | null;
  activeDialog: { npcId: string; text: string } | null;

  setConnected: (connected: boolean, playerId?: string) => void;
  setPlayerCount: (count: number) => void;
  setDialog: (dialog: { npcId: string; text: string } | null) => void;

  isBattling: boolean;
  battleRoomId: string | null;
  setBattling: (isBattling: boolean, battleRoomId?: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  connected: false,
  playerCount: 0,
  playerId: null,
  activeDialog: null,

  setConnected: (connected, playerId) =>
    set({ connected, playerId: playerId ?? null }),

  setPlayerCount: (count) => set({ playerCount: count }),

  setDialog: (dialog) => set({ activeDialog: dialog }),

  isBattling: false,
  battleRoomId: null,
  setBattling: (isBattling, battleRoomId) => set({ isBattling, battleRoomId: battleRoomId ?? null }),
}));
