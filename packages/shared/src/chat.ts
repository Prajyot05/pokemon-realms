export type ChatMessageType = 'ZONE' | 'PROXIMITY' | 'WHISPER' | 'SYSTEM';

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  sender: string; // playerId
  senderName: string;
  text: string;
  timestamp: number;
}

export interface SendChatMessage {
  text: string;
  targetUsername?: string; // used for WHISPER
}
