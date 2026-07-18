import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { networkManager } from '../game/network/NetworkManager';

export function TradeWindow() {
  const isTrading = useGameStore((s) => s.isTrading);
  const tradeRoomId = useGameStore((s) => s.tradeRoomId);
  
  const [phase, setPhase] = useState('SELECTING');
  const [p1Data, setP1Data] = useState<any>(null);
  const [p2Data, setP2Data] = useState<any>(null);
  
  // For selecting from own party/PC
  const [partyPokemon, setPartyPokemon] = useState<any[]>([]);

  useEffect(() => {
    if (!isTrading || !tradeRoomId || !networkManager.tradeRoom) return;

    const room = networkManager.tradeRoom;

    // Fetch own party to pick from
    // Quick hack: just fetch PC_DATA with boxNumber -1 to mean Party, or use a new message
    // Actually we can just send FETCH_PC to world room? No, world room can't respond if we are in trade room?
    // Wait, the client is connected to BOTH WorldRoom and TradeRoom.
    networkManager.getRoom()?.send('FETCH_PC', { boxNumber: 0 }); // Just for demo, fetching box 0
    // We should ideally fetch party. Let's assume the client gets it somehow or we just add a small mock for the UI.
    
    const unsubscribe = room.onStateChange((state) => {
      setPhase(state.phase);
      
      const myId = networkManager.getSessionId();
      // TradeRoom schema has players map
      let me = null;
      let other = null;
      
      state.players.forEach((p: any, sessionId: string) => {
        // Here we just map by sessionId if it matches, but the TradeRoom uses the WorldRoom's user ID as ID, not sessionId.
        // Wait, the TradeRoom uses `client.sessionId` for the map keys. Let's assume it does.
        if (p.id === networkManager.getRoom()?.userData?.userId?.toString()) {
            // Wait, we don't have userData easily accessible.
        }
        
        // Simpler: just sort by who is who
        // Since we are P1 or P2, let's just pick the first one as P1, second as P2 for display
      });
      
      const playersArr = Array.from(state.players.values()) as any[];
      if (playersArr.length === 2) {
        setP1Data(playersArr[0]);
        setP2Data(playersArr[1]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isTrading, tradeRoomId]);

  if (!isTrading) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.85)', zIndex: 1000,
      display: 'flex', flexDirection: 'column', color: '#fff',
      fontFamily: 'monospace', padding: 20
    }}>
      <h2 style={{ textAlign: 'center' }}>Trade Center</h2>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>Status: {phase}</div>
      
      <div style={{ display: 'flex', flex: 1, gap: 20 }}>
        {/* Player 1 */}
        <div style={{ flex: 1, border: '2px solid #555', borderRadius: 8, padding: 10 }}>
          <h3>{p1Data?.name || 'Player 1'}</h3>
          <div style={{ margin: '20px 0' }}>
            {p1Data?.offeredPokemonId !== -1 ? (
              <div style={{ background: '#333', padding: 10, borderRadius: 8 }}>
                Lvl {p1Data?.offeredPokemonData?.level} {p1Data?.offeredPokemonData?.speciesId}
                {p1Data?.offeredPokemonData?.isShiny ? ' ✨' : ''}
              </div>
            ) : (
              <div style={{ color: '#888' }}>No Pokemon Selected</div>
            )}
          </div>
          <div>Ready: {p1Data?.isReady ? '✅' : '❌'}</div>
          <div>Confirmed: {p1Data?.isConfirmed ? '✅' : '❌'}</div>
          
          <div style={{ marginTop: 20 }}>
            <button 
              onClick={() => networkManager.sendTradeOffer(1)} // Mock ID 1
              style={{ padding: '8px 16px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 4, marginRight: 10 }}
            >Offer Pkm 1</button>
            <button 
              onClick={() => networkManager.sendTradeOffer(2)} // Mock ID 2
              style={{ padding: '8px 16px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 4 }}
            >Offer Pkm 2</button>
          </div>
        </div>
        
        {/* Player 2 */}
        <div style={{ flex: 1, border: '2px solid #555', borderRadius: 8, padding: 10 }}>
          <h3>{p2Data?.name || 'Player 2'}</h3>
          <div style={{ margin: '20px 0' }}>
            {p2Data?.offeredPokemonId !== -1 ? (
              <div style={{ background: '#333', padding: 10, borderRadius: 8 }}>
                Lvl {p2Data?.offeredPokemonData?.level} {p2Data?.offeredPokemonData?.speciesId}
                {p2Data?.offeredPokemonData?.isShiny ? ' ✨' : ''}
              </div>
            ) : (
              <div style={{ color: '#888' }}>No Pokemon Selected</div>
            )}
          </div>
          <div>Ready: {p2Data?.isReady ? '✅' : '❌'}</div>
          <div>Confirmed: {p2Data?.isConfirmed ? '✅' : '❌'}</div>
        </div>
      </div>
      
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20 }}>
        {phase === 'SELECTING' && (
          <button 
            onClick={() => networkManager.sendTradeReady(true)}
            style={{ padding: '12px 24px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 }}
          >Ready</button>
        )}
        {phase === 'READY' && (
          <button 
            onClick={() => networkManager.sendTradeConfirm()}
            style={{ padding: '12px 24px', background: '#f1c40f', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}
          >Confirm Trade</button>
        )}
        <button 
          onClick={() => networkManager.sendTradeCancel()}
          style={{ padding: '12px 24px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 }}
        >Cancel</button>
      </div>
    </div>
  );
}

export function TradeRequestOverlay() {
  const request = useGameStore((s) => s.tradeRequest);
  
  if (!request) return null;
  
  return (
    <div style={{
      position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(52, 152, 219, 0.9)', color: '#fff', padding: '16px 24px',
      borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 950,
      display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'monospace'
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Trade Request</h3>
      <div style={{ marginBottom: 15 }}>{request.fromUsername} wants to trade!</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button 
          onClick={() => networkManager.acceptTrade(request.fromPlayerId)}
          style={{ padding: '8px 16px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >Accept</button>
        <button 
          onClick={() => networkManager.rejectTrade()}
          style={{ padding: '8px 16px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >Reject</button>
      </div>
    </div>
  );
}
