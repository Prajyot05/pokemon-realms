import { useState } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { Pokedex } from './Pokedex';
import { PartyPanel } from './PartyPanel';
import { PCStorage } from './PCStorage';
import { networkManager } from '../game/network/NetworkManager';

export function HUD() {
  const connected = useGameStore((s) => s.connected);
  const playerId = useGameStore((s) => s.playerId);
  const playerCount = useGameStore((s) => s.playerCount);
  const [pokedexOpen, setPokedexOpen] = useState(false);
  const [pcOpen, setPcOpen] = useState(false);
  const [party, setParty] = useState([]);
  const [pc, setPc] = useState([]);

  useEffect(() => {
    if (connected) {
      const room = networkManager.getRoom();
      if (!room) return;

      room.onMessage('PARTY_DATA', (data: any) => {
        setParty(data);
      });

      room.onMessage('PC_DATA', (data: any) => {
        setPc(data.data);
      });

      room.onMessage('ENCOUNTER_CAUGHT', () => {
        // Refresh party and PC
        room.send('FETCH_PARTY');
        room.send('FETCH_PC');
      });

      // Initial fetch
      room.send('FETCH_PARTY');
      room.send('FETCH_PC');
    }
  }, [connected]);

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
      <button
        onClick={() => setPokedexOpen(true)}
        style={{
          marginTop: 12,
          background: '#e74c3c',
          color: '#fff',
          border: '1px solid #c0392b',
          borderRadius: 4,
          padding: '4px 8px',
          cursor: 'pointer',
          width: '100%',
          fontWeight: 'bold',
        }}
      >
        OPEN POKéDEX
      </button>

      <button
        onClick={() => setPcOpen(true)}
        style={{
          marginTop: 8,
          background: '#34495e',
          color: '#fff',
          border: '1px solid #2c3e50',
          borderRadius: 4,
          padding: '4px 8px',
          cursor: 'pointer',
          width: '100%',
          fontWeight: 'bold',
        }}
      >
        ACCESS PC
      </button>

      <div style={{ marginTop: 16 }}>
        <PartyPanel party={party} />
      </div>

      {pokedexOpen && <Pokedex onClose={() => setPokedexOpen(false)} />}
      {pcOpen && <PCStorage pc={pc} onClose={() => setPcOpen(false)} />}
    </div>
  );
}
