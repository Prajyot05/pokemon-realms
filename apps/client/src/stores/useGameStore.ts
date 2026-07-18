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

  chatMessages: any[];
  addChatMessage: (msg: any) => void;
  addChatMessages: (msgs: any[]) => void;

  isTrading: boolean;
  tradeRoomId: string | null;
  tradeRequest: { fromUsername: string; fromPlayerId: number } | null;
  setTrading: (isTrading: boolean, tradeRoomId?: string) => void;
  setTradeRequest: (req: { fromUsername: string; fromPlayerId: number } | null) => void;
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

  chatMessages: [],
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  addChatMessages: (msgs) => set((state) => ({ chatMessages: [...state.chatMessages, ...msgs] })),

  isTrading: false,
  tradeRoomId: null,
  tradeRequest: null,
  setTrading: (isTrading, tradeRoomId) => set({ isTrading, tradeRoomId: tradeRoomId ?? null }),
  setTradeRequest: (req) => set({ tradeRequest: req }),
}));
