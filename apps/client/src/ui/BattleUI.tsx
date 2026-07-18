import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { networkManager } from '../game/network/NetworkManager';
import { BattleAction } from '@pokemon-realms/shared';

export function BattleUI() {
  const isBattling = useGameStore((s) => s.isBattling);
  const [text, setText] = useState('');
  const [menu, setMenu] = useState<'MAIN' | 'FIGHT'>('MAIN');
  
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

  if (!isBattling) return null;

  const sendAction = (action: Omit<BattleAction, 'playerId'>) => {
    // Cast to BattleAction since server fills in playerId anyway
    // @ts-ignore
    networkManager.battleRoom?.send('BATTLE_ACTION', action);
    setMenu('MAIN');
    setText('Waiting for other player...');
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '150px',
      background: '#fff',
      borderTop: '4px solid #000',
      display: 'flex',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '24px',
      zIndex: 100
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
  );
}

const btnStyle = {
  width: '50%',
  height: '50%',
  fontSize: '24px',
  fontFamily: 'monospace',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  textAlign: 'left' as const
};
