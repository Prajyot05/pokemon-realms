// ─── Shared Types: Pokemon Realms ───
// These types are the single source of truth between client and server.

/** Direction a player can face / move */
export type Direction = 'up' | 'down' | 'left' | 'right';

export function isValidDirection(dir: any): dir is Direction {
  return ['up', 'down', 'left', 'right'].includes(dir);
}

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
  INTERACT: 'interact',
  DIALOG: 'dialog',
} as const;

export * from './schemas/PlayerSchema';
export * from './schemas/NPCSchema';
export * from './schemas/BattleSchema';
export * from './pokemon/genetics';
export * from './battle';
export * from './chat';

/** Movement speed in pixels per tick (server-authoritative) */
export const MOVE_SPEED = 4;

/** Tile size in pixels */
export const TILE_SIZE = 32;

/** Canvas dimensions */
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
