import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { networkManager } from '../game/network/NetworkManager';
import { BattleAction } from '@pokemon-realms/shared';

export function BattleUI() {
  const isBattling = useGameStore((s) => s.isBattling);
  const [text, setText] = useState('');
  const [menu, setMenu] = useState<'MAIN' | 'FIGHT'>('MAIN');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [battleState, setBattleState] = useState<any>(null);
  const [localHp, setLocalHp] = useState<Record<string, number>>({});
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    const handleText = (e: Event) => {
      setText((e as CustomEvent).detail);
    };
    const handleDamage = (e: Event) => {
      const { targetId, amount } = (e as CustomEvent).detail;
      setLocalHp(prev => {
        const current = prev[targetId];
        if (current === undefined) return prev; // If not set yet, ignore
        return { ...prev, [targetId]: Math.max(0, current - amount) };
      });
    };
    const handleEnded = () => {
      useGameStore.getState().setBattling(false);
    };

    window.addEventListener('BATTLE_UI_TEXT', handleText);
    window.addEventListener('BATTLE_UI_DAMAGE', handleDamage);
    window.addEventListener('BATTLE_ENDED_PHASER', handleEnded);

    return () => {
      window.removeEventListener('BATTLE_UI_TEXT', handleText);
      window.removeEventListener('BATTLE_UI_DAMAGE', handleDamage);
      window.removeEventListener('BATTLE_ENDED_PHASER', handleEnded);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('BATTLE_FULLSCREEN', { detail: isFullscreen }));
  }, [isFullscreen]);

  useEffect(() => {
    if (isBattling && networkManager.battleRoom) {
      const room = networkManager.battleRoom;
      setBattleState(room.state.toJSON());
      
      // Initialize local HP if not set
      const stateObj = room.state.toJSON();
      const initialHp: Record<string, number> = {};
      Object.values(stateObj.players).forEach((p: any) => {
        initialHp[p.id] = p.activePokemon.currentHp;
      });
      setLocalHp(prev => Object.keys(prev).length === 0 ? initialHp : prev);

      const sub = room.onStateChange((state) => {
        setBattleState(state.toJSON());
      });

      return () => {
        // cleanup if needed
      };
    }
  }, [isBattling]);

  if (!isBattling) return null;

  const sendAction = (action: Omit<BattleAction, 'playerId'>) => {
    // Cast to BattleAction since server fills in playerId anyway
    // @ts-ignore
    networkManager.battleRoom?.send('BATTLE_ACTION', action);
    setMenu('MAIN');
    setText('Waiting for other player...');
  };

  const scale = isFullscreen ? Math.min(windowSize.w / 600, windowSize.h / 400) : 1;

  // Adjust container styles based on fullscreen mode
  const containerStyle: React.CSSProperties = isFullscreen 
    ? {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
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

  const btnStyle: React.CSSProperties = {
    padding: '10px',
    fontSize: '18px',
    cursor: 'pointer',
    border: '2px solid #ccc',
    borderRadius: '4px',
    background: '#f9f9f9',
    fontWeight: 'bold',
    pointerEvents: 'auto'
  };

  // Extract players from state
  let p1: any = null;
  let p2: any = null;
  if (battleState && battleState.players) {
    const players = Object.values(battleState.players) as any[];
    p1 = players.find(p => p.id !== 'WILD');
    p2 = players.find(p => p.id === 'WILD') || players.find(p => p.id !== p1?.id);
    
    if (!p1) p1 = players[0];
    if (!p2) p2 = players[1];
  }

  const renderHealthBar = (player: any, isOpponent: boolean) => {
    if (!player) return null;
    const pkm = player.activePokemon;
    // Use localHp if available for smooth event-driven damage
    const displayHp = localHp[player.id] ?? pkm.currentHp;
    const hpPercent = Math.max(0, Math.min(100, (displayHp / pkm.maxHp) * 100));
    
    let barColor = '#4caf50'; // Green
    if (hpPercent <= 20) barColor = '#f44336'; // Red
    else if (hpPercent <= 50) barColor = '#ffeb3b'; // Yellow

    return (
      <div style={{
        position: 'absolute',
        top: isOpponent ? '30px' : 'auto',
        bottom: isOpponent ? 'auto' : '150px',
        left: isOpponent ? '30px' : 'auto',
        right: isOpponent ? 'auto' : '30px',
        background: 'rgba(255, 255, 255, 0.9)',
        border: '3px solid #333',
        borderRadius: '8px',
        padding: '10px 15px',
        width: '250px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        pointerEvents: 'none'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '5px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '18px', textTransform: 'capitalize' }}>
            {player.id === 'WILD' ? player.name : pkm.speciesId}
          </span>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Lv{pkm.level}</span>
        </div>
        
        {/* HP Bar Container */}
        <div style={{ background: '#555', border: '2px solid #222', borderRadius: '4px', height: '12px', width: '100%', overflow: 'hidden' }}>
          <div style={{ 
            background: barColor, 
            width: `${hpPercent}%`, 
            height: '100%',
            transition: 'width 0.3s ease-out, background-color 0.3s'
          }} />
        </div>
        
        {/* HP Text (only for player usually, but we can show for both or just player) */}
        {!isOpponent && (
          <div style={{ textAlign: 'right', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
            {Math.ceil(displayHp)} / {pkm.maxHp}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={containerStyle}>
      {renderHealthBar(p2, true)}
      {renderHealthBar(p1, false)}

      <button 
        style={{ 
          position: 'absolute', 
          top: '-40px', 
          right: '0', 
          pointerEvents: 'auto', 
          padding: '5px 10px', 
          background: '#333', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer' 
        }}
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
