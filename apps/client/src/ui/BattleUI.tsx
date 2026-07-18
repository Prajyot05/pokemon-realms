import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { networkManager } from '../game/network/NetworkManager';
import { BattleAction } from '@pokemon-realms/shared';

export function BattleUI() {
  const isBattling = useGameStore((s) => s.isBattling);
  const [text, setText] = useState('');
  const [menu, setMenu] = useState<'MAIN' | 'FIGHT'>('MAIN');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  useEffect(() => {
    const handleText = (e: Event) => {
      setText((e as CustomEvent).detail);
    };
    const handleEnded = () => {
      useGameStore.getState().setBattling(false);
    };

    window.addEventListener('BATTLE_UI_TEXT', handleText);
    window.addEventListener('BATTLE_ENDED_PHASER', handleEnded);

    return () => {
      window.removeEventListener('BATTLE_UI_TEXT', handleText);
      window.removeEventListener('BATTLE_ENDED_PHASER', handleEnded);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('BATTLE_FULLSCREEN', { detail: isFullscreen }));
  }, [isFullscreen]);

  if (!isBattling) return null;

  const sendAction = (action: Omit<BattleAction, 'playerId'>) => {
    // Cast to BattleAction since server fills in playerId anyway
    // @ts-ignore
    networkManager.battleRoom?.send('BATTLE_ACTION', action);
    setMenu('MAIN');
    setText('Waiting for other player...');
  };

  // Adjust container styles based on fullscreen mode
  const containerStyle: React.CSSProperties = isFullscreen 
    ? {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '400px',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        zIndex: 100
      }
    : {
        position: 'absolute',
        right: '20px',
        bottom: '20px',
        width: '600px',
        height: '400px',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        zIndex: 100
      };

  return (
    <div style={containerStyle}>
      <button 
        style={{ pointerEvents: 'auto', alignSelf: 'flex-end', marginBottom: '10px', padding: '5px 10px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        onClick={() => setIsFullscreen(!isFullscreen)}
      >
        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>

      <div style={{
        pointerEvents: 'auto',
        height: '120px',
        background: '#fff',
        border: '4px solid #333',
        borderRadius: '8px',
        display: 'flex',
        padding: '10px',
        fontFamily: 'monospace',
        fontSize: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        marginBottom: '10px'
      }}>
      <div style={{ flex: 1, borderRight: '4px solid #000', paddingRight: '10px' }}>
        {text || 'What will you do?'}
      </div>
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', paddingLeft: '10px' }}>
        {menu === 'MAIN' && (
          <>
            <button style={btnStyle} onClick={() => setMenu('FIGHT')}>FIGHT</button>
            <button style={btnStyle} onClick={() => alert('Bag not implemented')}>BAG</button>
            <button style={btnStyle} onClick={() => alert('Pokemon switch not implemented')}>POKEMON</button>
            <button style={btnStyle} onClick={() => sendAction({ type: 'RUN' })}>RUN</button>
          </>
        )}
        {menu === 'FIGHT' && (
          <>
            <button style={btnStyle} onClick={() => sendAction({ type: 'FIGHT', moveId: 'TACKLE' })}>TACKLE</button>
            <button style={btnStyle} onClick={() => sendAction({ type: 'FIGHT', moveId: 'GROWL' })}>GROWL</button>
            <button style={btnStyle} onClick={() => sendAction({ type: 'FIGHT', moveId: 'THUNDERBOLT' })}>THUNDERBOLT</button>
            <button style={btnStyle} onClick={() => setMenu('MAIN')}>CANCEL</button>
          </>
        )}
      </div>
      </div>
    </div>
  );
}

const btnStyle = {
  width: '50%',
  height: '50%',
  fontSize: '20px',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  textAlign: 'left' as const
};
