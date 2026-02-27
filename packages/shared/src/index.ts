// ─── Shared Types: Pokemon Realms ───
// These types are the single source of truth between client and server.

/** Direction a player can face / move */
export type Direction = 'up' | 'down' | 'left' | 'right';

/** Movement message sent from client → server */
export interface MoveMessage {
  direction: Direction;
}

/** Snapshot of a single player's state (used for UI overlays) */
export interface PlayerState {
  id: string;
  x: number;
  y: number;
  direction: Direction;
}

/** Server → client: full map metadata (future milestone) */
export interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
}

/** Protocol message types */
export const MessageType = {
  MOVE: 'move',
} as const;

/** Movement speed in pixels per tick (server-authoritative) */
export const MOVE_SPEED = 4;

/** Tile size in pixels */
export const TILE_SIZE = 32;

/** Canvas dimensions */
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
