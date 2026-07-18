import { Client, Room } from 'colyseus.js';
import { useGameStore } from '../../stores/useGameStore';
import { MessageType } from '@pokemon-realms/shared';
import type { Direction } from '@pokemon-realms/shared';

import { WorldState, BattleState, TradeState, TradeOffer } from '@pokemon-realms/shared';

const SERVER_URL = 'ws://localhost:3001';

class NetworkManager {
  private client: Client;
  private room: Room<WorldState> | null = null;
  public battleRoom: Room<BattleState> | null = null;
  public tradeRoom: Room<TradeState> | null = null;

  constructor() {
    this.client = new Client(SERVER_URL);
  }

  async connect(mapId: string = 'pallet-town', token?: string): Promise<Room<WorldState>> {
    this.room = await this.client.joinOrCreate<WorldState>('zone', { mapId, token }, WorldState);

    useGameStore.getState().setConnected(true, this.room.sessionId);
    console.log(`🔗 Connected as ${this.room.sessionId}`);

    // Log any errors
    this.room.onError((code, message) => {
      console.error(`Room error [${code}]:`, message);
    });

    // Listen for players added (this automatically triggers for existing players too!)
    if (this.room.state.players) {
      this.room.state.players.onAdd((player, sessionId: string) => {
        if (this.room?.state.players) {
          useGameStore.getState().setPlayerCount(this.room.state.players.size);
        }
      });

      this.room.state.players.onRemove((player, sessionId: string) => {
        if (this.room?.state.players) {
          useGameStore.getState().setPlayerCount(this.room.state.players.size);
        }
      });

      // Initialize players already present in the room state
      if (this.room.state.players.size > 0) {
        useGameStore.getState().setPlayerCount(this.room.state.players.size);
      }
    }

    // Listen for custom messages
    this.room.onMessage(MessageType.DIALOG, (message: { npcId: string; text: string }) => {
      useGameStore.getState().setDialog(message);
    });

    this.room.onMessage('CHAT_MESSAGE', (message: any) => {
      useGameStore.getState().addChatMessage(message);
    });

    this.room.onMessage('CHAT_HISTORY', (messages: any[]) => {
      useGameStore.getState().addChatMessages(messages);
    });

    this.room.onMessage('TRADE_REQUEST', (message: { fromUsername: string; fromPlayerId: number }) => {
      useGameStore.getState().setTradeRequest(message);
    });

    this.room.onMessage('TRADE_START', (message: { roomId: string }) => {
      window.dispatchEvent(new CustomEvent('BATTLE_ENCOUNTER_START')); // Lock movement
      this.connectTrade(message.roomId).catch(err => {
        console.error('Failed to connect to trade room:', err);
        useGameStore.getState().setTrading(false);
        window.dispatchEvent(new CustomEvent('BATTLE_ENDED_PHASER')); // unlock world
      });
    });

    this.room.onLeave(() => {
      useGameStore.getState().setConnected(false);
      console.log('🔌 Disconnected from server');
    });

    // Request chat history upon connection
    this.room.send('FETCH_CHAT_HISTORY');

    this.room.onMessage('BATTLE_START', (message: { roomId: string }) => {
      // Lock movement instantly before network connection finishes
      window.dispatchEvent(new CustomEvent('BATTLE_ENCOUNTER_START'));
      // Connect to the battle room concurrently
      this.connectBattle(message.roomId).catch(err => {
        console.error('Failed to connect to battle room:', err);
        useGameStore.getState().setBattling(false);
        window.dispatchEvent(new CustomEvent('BATTLE_ENDED_PHASER')); // unlock world
      });
    });

    return this.room;
  }

  async connectBattle(roomId: string): Promise<Room<BattleState>> {
    const token = localStorage.getItem('jwt');
    if (!token) throw new Error('No token');
    
    this.battleRoom = await this.client.joinById<BattleState>(roomId, { token });
    useGameStore.getState().setBattling(true, roomId);

    // Phaser scenes can listen to this event to launch BattleScene
    window.dispatchEvent(new CustomEvent('BATTLE_START_PHASER', { detail: { roomId } }));

    this.battleRoom.onMessage('BATTLE_TURN_RESULT', (result: any) => {
      window.dispatchEvent(new CustomEvent('BATTLE_TURN_RESULT', { detail: result }));
    });

    this.battleRoom.onMessage('BATTLE_END', (data: any) => {
      window.dispatchEvent(new CustomEvent('BATTLE_END', { detail: data }));
    });

    this.battleRoom.onLeave(() => {
      useGameStore.getState().setBattling(false);
      window.dispatchEvent(new CustomEvent('BATTLE_ENDED_PHASER'));
      this.battleRoom = null;
      this.room?.send('BATTLE_ENDED');
    });

    return this.battleRoom;
  }

  async connectTrade(roomId: string): Promise<Room<TradeState>> {
    const token = localStorage.getItem('jwt');
    if (!token) throw new Error('No token');
    
    this.tradeRoom = await this.client.joinById<TradeState>(roomId, { token });
    useGameStore.getState().setTrading(true, roomId);

    this.tradeRoom.onMessage('TRADE_COMPLETED', () => {
      // Handled by state changes, but can trigger effects here
      setTimeout(() => {
        useGameStore.getState().setTrading(false);
        window.dispatchEvent(new CustomEvent('BATTLE_ENDED_PHASER'));
      }, 3000);
    });

    this.tradeRoom.onMessage('TRADE_CANCELLED', (data: any) => {
      console.log('Trade cancelled:', data.reason);
      setTimeout(() => {
        useGameStore.getState().setTrading(false);
        window.dispatchEvent(new CustomEvent('BATTLE_ENDED_PHASER'));
      }, 1000);
    });

    this.tradeRoom.onLeave(() => {
      useGameStore.getState().setTrading(false);
      window.dispatchEvent(new CustomEvent('BATTLE_ENDED_PHASER'));
      this.tradeRoom = null;
    });

    return this.tradeRoom;
  }

  sendInteract() {
    this.room?.send(MessageType.INTERACT);
  }

  sendMove(direction: Direction) {
    this.room?.send(MessageType.MOVE, { direction });
  }

  sendStop() {
    this.room?.send('STOP');
  }

  sendChat(text: string, targetUsername?: string) {
    this.room?.send('CHAT_MESSAGE', { text, targetUsername });
  }

  acceptTrade(fromPlayerId: number) {
    this.room?.send('ACCEPT_TRADE', { fromPlayerId });
    useGameStore.getState().setTradeRequest(null);
  }

  rejectTrade() {
    useGameStore.getState().setTradeRequest(null);
  }

  sendTradeOffer(pokemonId: number | null) {
    this.tradeRoom?.send('TRADE_OFFER', { pokemonId });
  }

  sendTradeReady(ready: boolean) {
    this.tradeRoom?.send('TRADE_READY', { ready });
  }

  sendTradeConfirm() {
    this.tradeRoom?.send('TRADE_CONFIRM');
  }

  sendTradeCancel() {
    this.tradeRoom?.send('TRADE_CANCEL');
  }

  getSessionId(): string | null {
    return this.room?.sessionId ?? null;
  }

  getRoom(): Room<WorldState> | null {
    return this.room;
  }
}

// Singleton
export const networkManager = new NetworkManager();
