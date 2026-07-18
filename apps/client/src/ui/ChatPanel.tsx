import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { networkManager } from '../game/network/NetworkManager';
import { ChatMessage } from '@pokemon-realms/shared';

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'WHISPER'>('ALL');
  
  const messages = useGameStore((s) => s.chatMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayedMessages = messages.filter(msg => {
    if (filterType === 'WHISPER') return msg.type === 'WHISPER';
    return true;
  });

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedMessages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    let text = inputValue.trim();
    let targetUsername = undefined;

    // Check for whisper prefix
    const whisperMatch = text.match(/^\/w\s+([^\s]+)\s+(.*)$/);
    if (whisperMatch) {
      targetUsername = whisperMatch[1];
      text = whisperMatch[2];
    } else if (text.startsWith('/w ')) {
      // Invalid whisper format
      setInputValue('');
      return;
    }

    networkManager.sendChat(text, targetUsername);
    setInputValue('');
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'WHISPER': return '#9b59b6'; // Purple
      case 'PROXIMITY': return '#f39c12'; // Orange
      case 'SYSTEM': return '#e74c3c'; // Red
      default: return '#3498db'; // Blue (Zone)
    }
  };

  const getPrefixForType = (type: string) => {
    switch (type) {
      case 'WHISPER': return '[W]';
      case 'PROXIMITY': return '[P]';
      case 'SYSTEM': return '[S]';
      default: return '[Z]';
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          border: '1px solid #555',
          borderRadius: 8,
          padding: '8px 16px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          zIndex: 900
        }}
      >
        Open Chat
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: 20,
      width: 320,
      height: 250,
      background: 'rgba(0,0,0,0.85)',
      borderRadius: 8,
      border: '2px solid #555',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'monospace',
      color: '#fff',
      zIndex: 900
    }}>
      {/* Header / Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #555',
        background: 'rgba(255,255,255,0.1)'
      }}>
        <button 
          onClick={() => setFilterType('ALL')}
          style={{ flex: 1, padding: '4px 0', background: filterType === 'ALL' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', borderTopLeftRadius: 6 }}
        >ALL</button>
        <button 
          onClick={() => setFilterType('WHISPER')}
          style={{ flex: 1, padding: '4px 0', background: filterType === 'WHISPER' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', borderLeft: '1px solid #555' }}
        >WHISPERS</button>
        <button 
          onClick={() => setIsOpen(false)}
          style={{ padding: '4px 12px', background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', borderLeft: '1px solid #555', fontWeight: 'bold' }}
        >_</button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}>
        {displayedMessages.map((msg: ChatMessage) => (
          <div key={msg.id} style={{ fontSize: 12, wordWrap: 'break-word' }}>
            <span style={{ color: '#888', fontSize: 10, marginRight: 4 }}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span style={{ color: getColorForType(msg.type), fontWeight: 'bold', marginRight: 4 }}>
              {getPrefixForType(msg.type)}
            </span>
            <span style={{ color: msg.senderName === 'SYSTEM' ? '#e74c3c' : '#2ecc71', fontWeight: 'bold' }}>
              {msg.senderName}:
            </span>
            <span style={{ marginLeft: 4, color: msg.type === 'SYSTEM' ? '#e74c3c' : '#fff' }}>
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ display: 'flex', borderTop: '1px solid #555' }}>
        <input 
          ref={inputRef}
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type... (/w name msg for whisper)"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#fff',
            padding: '8px',
            fontFamily: 'monospace',
            outline: 'none'
          }}
          onFocus={() => {
            // Optional: disable game key inputs when chatting
            window.dispatchEvent(new CustomEvent('CHAT_FOCUSED', { detail: true }));
          }}
          onBlur={() => {
            window.dispatchEvent(new CustomEvent('CHAT_FOCUSED', { detail: false }));
          }}
        />
        <button type="submit" style={{
          background: '#3498db',
          color: '#fff',
          border: 'none',
          padding: '0 16px',
          cursor: 'pointer',
          borderBottomRightRadius: 6
        }}>SEND</button>
      </form>
    </div>
  );
}
