export type TradePhase = 'SELECTING' | 'READY' | 'CONFIRMING' | 'COMPLETED' | 'CANCELLED';

export interface TradeOffer {
  pokemonId: number | null; // Just 1 for now to simplify
}

export interface TradeMessage {
  type: 'TRADE_OFFER' | 'TRADE_READY' | 'TRADE_CONFIRM' | 'TRADE_CANCEL';
  payload?: any;
}
