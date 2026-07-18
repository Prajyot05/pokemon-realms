export type BattlePhase = 'WAITING_FOR_ACTIONS' | 'RESOLVING_TURN' | 'APPLY_EFFECTS' | 'CHECK_FAINT' | 'SWITCH_PROMPT' | 'BATTLE_END';

export type ActionType = 'FIGHT' | 'BAG' | 'POKEMON' | 'RUN';

export interface BattleAction {
  playerId: string;
  type: ActionType;
  moveId?: string; // If FIGHT
  itemId?: string; // If BAG
  pokemonIndex?: number; // If POKEMON (switch to this party index)
}

export type BattleEventType = 
  | 'TEXT' 
  | 'DAMAGE' 
  | 'HEAL' 
  | 'STATUS_APPLY' 
  | 'FAINT' 
  | 'ANIMATION' 
  | 'SWITCH' 
  | 'STAT_CHANGE' 
  | 'WEATHER';

export interface BattleEvent {
  type: BattleEventType;
  text?: string; 
  targetId?: string; // which pokemon is targeted (playerId usually)
  sourceId?: string; // who did the action
  amount?: number; // HP change amount
  status?: string; 
  stat?: string;
  stages?: number; // -6 to 6
  animationId?: string;
  pokemonIndex?: number; // for switches
}

export interface TurnResult {
  turnNumber: number;
  events: BattleEvent[];
}
