import { useGameStore } from '../stores/useGameStore';

export function HUD() {
  const connected = useGameStore((s) => s.connected);
  const playerId = useGameStore((s) => s.playerId);
  const playerCount = useGameStore((s) => s.playerCount);

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: 8,
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 13,
        background: 'rgba(0,0,0,0.6)',
        padding: '8px 12px',
        borderRadius: 6,
      }}
    >
      <div>
        Status:{' '}
        <span style={{ color: connected ? '#2ecc71' : '#e74c3c' }}>
          {connected ? 'Connected' : 'Connecting...'}
        </span>
      </div>
      {playerId && (
        <div style={{ opacity: 0.7 }}>ID: {playerId.slice(0, 8)}...</div>
      )}
      <div>Players online: {playerCount}</div>
      <div style={{ marginTop: 6, opacity: 0.5, fontSize: 11 }}>
        Arrow keys to move
      </div>
    </div>
  );
}
