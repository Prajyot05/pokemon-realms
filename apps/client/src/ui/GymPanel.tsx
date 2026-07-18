import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { networkManager } from '../game/network/NetworkManager';

export function GymPanel() {
  const isOpen = useGameStore((s) => s.isGymPanelOpen);
  const setOpen = useGameStore((s) => s.setGymPanelOpen);
  const gyms = useGameStore((s) => s.gyms);
  const leaderboard = useGameStore((s) => s.gymLeaderboard);

  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE' | 'LEADERBOARD'>('LIST');
  const [typeSpecialty, setTypeSpecialty] = useState('FIRE');
  const [badgeName, setBadgeName] = useState('');

  useEffect(() => {
    if (isOpen && activeTab === 'LEADERBOARD') {
      networkManager.fetchGymLeaderboard();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeName) return;
    networkManager.sendGymCreate(typeSpecialty, badgeName);
    setActiveTab('LIST');
  };

  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      width: 500, height: 400, background: 'rgba(0,0,0,0.9)', color: '#fff',
      border: '2px solid #555', borderRadius: 8, zIndex: 900,
      display: 'flex', flexDirection: 'column', fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #555' }}>
        <button 
          onClick={() => setActiveTab('LIST')}
          style={{ flex: 1, padding: 12, background: activeTab === 'LIST' ? '#333' : 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}
        >Gyms in Zone</button>
        <button 
          onClick={() => setActiveTab('CREATE')}
          style={{ flex: 1, padding: 12, background: activeTab === 'CREATE' ? '#333' : 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}
        >Found Gym</button>
        <button 
          onClick={() => setActiveTab('LEADERBOARD')}
          style={{ flex: 1, padding: 12, background: activeTab === 'LEADERBOARD' ? '#333' : 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}
        >Leaderboard</button>
        <button 
          onClick={() => setOpen(false)}
          style={{ padding: '12px 16px', background: 'transparent', color: '#e74c3c', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >X</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {activeTab === 'LIST' && (
          <div>
            <h3>Active Gyms Here</h3>
            {gyms.length === 0 ? (
              <div style={{ color: '#888' }}>No gyms in this zone.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {gyms.map(g => (
                  <div key={g.id} style={{ border: '1px solid #444', padding: 10, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: 16 }}>{g.ownerName}'s Gym</div>
                      <div style={{ color: '#aaa', fontSize: 12 }}>Type: {g.typeSpecialty} | Badge: {g.badgeName}</div>
                      <div style={{ color: g.isOpen ? '#2ecc71' : '#e74c3c', fontSize: 12 }}>{g.isOpen ? 'OPEN' : 'CLOSED'}</div>
                    </div>
                    {g.isOpen && (
                      <button 
                        onClick={() => networkManager.sendGymChallenge(g.id)}
                        style={{ padding: '8px 16px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                      >Challenge!</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'CREATE' && (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <h3>Found a New Gym</h3>
            <p style={{ fontSize: 12, color: '#aaa' }}>Your gym will be created at your current location.</p>
            <div>
              <label style={{ display: 'block', marginBottom: 5 }}>Type Specialty</label>
              <select 
                value={typeSpecialty} 
                onChange={e => setTypeSpecialty(e.target.value)}
                style={{ width: '100%', padding: 8, background: '#222', color: '#fff', border: '1px solid #555' }}
              >
                <option>FIRE</option>
                <option>WATER</option>
                <option>GRASS</option>
                <option>ELECTRIC</option>
                <option>DRAGON</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 5 }}>Badge Name</label>
              <input 
                type="text" 
                value={badgeName} 
                onChange={e => setBadgeName(e.target.value)}
                placeholder="e.g. Volcano Badge"
                style={{ width: '100%', padding: 8, background: '#222', color: '#fff', border: '1px solid #555', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" style={{ padding: '12px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginTop: 10 }}>
              Found Gym
            </button>
          </form>
        )}

        {activeTab === 'LEADERBOARD' && (
          <div>
            <h3>Global Gym Leaderboard</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #555' }}>
                  <th style={{ padding: 8 }}>Rank</th>
                  <th style={{ padding: 8 }}>Leader</th>
                  <th style={{ padding: 8 }}>Type</th>
                  <th style={{ padding: 8 }}>Win Streak</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((g, idx) => (
                  <tr key={g.id} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: 8 }}>#{idx + 1}</td>
                    <td style={{ padding: 8, color: '#3498db' }}>{g.ownerName}</td>
                    <td style={{ padding: 8 }}>{g.typeSpecialty}</td>
                    <td style={{ padding: 8, color: '#f1c40f', fontWeight: 'bold' }}>{g.winStreak} 🔥</td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 8, textAlign: 'center', color: '#888' }}>No gyms established yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
