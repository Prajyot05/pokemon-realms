import { Client, Room } from 'colyseus';
import { ChatMessage, ChatMessageType, SendChatMessage, WorldState } from '@pokemon-realms/shared';
import crypto from 'crypto';

class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord: boolean = false;
}

class ProfanityFilter {
  root: TrieNode = new TrieNode();

  constructor(badWords: string[]) {
    for (const word of badWords) {
      this.insert(word.toLowerCase());
    }
  }

  insert(word: string) {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isEndOfWord = true;
  }

  filter(text: string): string {
    const words = text.split(/(\b)/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();
      if (this.search(word)) {
        words[i] = '*'.repeat(words[i].length);
      }
    }
    return words.join('');
  }

  search(word: string): boolean {
    let node = this.root;
    for (const char of word) {
      if (!node.children.has(char)) {
        return false;
      }
      node = node.children.get(char)!;
    }
    return node.isEndOfWord;
  }
}

class TokenBucket {
  tokens: number;
  maxTokens: number;
  refillRate: number; // ms per token
  lastRefill: number;

  constructor(maxTokens: number, refillRate: number) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  consume(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor(elapsed / this.refillRate);
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

export class ChatManager {
  private filter: ProfanityFilter;
  private rateLimiters: Map<string, TokenBucket> = new Map();
  private history: ChatMessage[] = [];
  private readonly MAX_HISTORY = 100;
  
  // 5 tiles * 32 pixels = 160 pixels
  private readonly PROXIMITY_DIST_SQ = 160 * 160;

  constructor() {
    // Basic bad words list for dev
    this.filter = new ProfanityFilter(['fuck', 'shit', 'bitch', 'ass', 'asshole']);
  }

  processMessage(
    client: Client,
    room: Room<WorldState>,
    message: SendChatMessage
  ) {
    const senderId = client.userData?.userId?.toString();
    const senderName = room.state.players.get(client.sessionId)?.id || 'Unknown'; // Using sessionId as name fallback like elsewhere
    if (!senderId) return;

    // Rate Limiting (3 messages burst, 1 message per 667ms refill)
    let bucket = this.rateLimiters.get(senderId);
    if (!bucket) {
      bucket = new TokenBucket(3, 667);
      this.rateLimiters.set(senderId, bucket);
    }
    if (!bucket.consume()) {
      // Send rate limit warning just to sender
      client.send('CHAT_MESSAGE', {
        id: crypto.randomUUID(),
        type: 'SYSTEM',
        sender: 'SYSTEM',
        senderName: 'SYSTEM',
        text: 'You are sending messages too fast.',
        timestamp: Date.now()
      } as ChatMessage);
      return;
    }

    const filteredText = this.filter.filter(message.text.trim());
    if (filteredText.length === 0) return;

    const chatMsg: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'ZONE', // default
      sender: senderId,
      senderName,
      text: filteredText,
      timestamp: Date.now()
    };

    // Determine message type and routing
    if (message.targetUsername) {
      // WHISPER
      chatMsg.type = 'WHISPER';
      const targetClient = room.clients.find(c => {
        const p = room.state.players.get(c.sessionId);
        return p && p.id === message.targetUsername; // matching by the player schema 'id' (which is actually name/session fallback)
      });

      if (targetClient) {
        targetClient.send('CHAT_MESSAGE', chatMsg);
        client.send('CHAT_MESSAGE', chatMsg); // Send back to self
      } else {
        client.send('CHAT_MESSAGE', {
          ...chatMsg,
          type: 'SYSTEM',
          sender: 'SYSTEM',
          senderName: 'SYSTEM',
          text: `User ${message.targetUsername} not found in this zone.`
        });
      }
    } else if (filteredText.startsWith('/p ')) {
      // PROXIMITY
      chatMsg.type = 'PROXIMITY';
      chatMsg.text = filteredText.substring(3).trim();
      
      const senderPlayer = room.state.players.get(client.sessionId);
      if (!senderPlayer) return;

      room.clients.forEach(c => {
        const targetPlayer = room.state.players.get(c.sessionId);
        if (targetPlayer) {
          const dx = targetPlayer.x - senderPlayer.x;
          const dy = targetPlayer.y - senderPlayer.y;
          const distSq = dx * dx + dy * dy;
          if (distSq <= this.PROXIMITY_DIST_SQ) {
            c.send('CHAT_MESSAGE', chatMsg);
          }
        }
      });
      // Don't add proximity to zone history
    } else {
      // ZONE
      room.broadcast('CHAT_MESSAGE', chatMsg);
      
      // Add to history
      this.history.push(chatMsg);
      if (this.history.length > this.MAX_HISTORY) {
        this.history.shift();
      }
    }
  }

  sendHistory(client: Client) {
    client.send('CHAT_HISTORY', this.history);
  }
}
