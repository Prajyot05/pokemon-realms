import { PokemonInstanceData } from '@pokemon-realms/shared';
import pokemonData from '@pokemon-realms/shared/src/data/pokemon.json';

interface PartyPanelProps {
  party: PokemonInstanceData[];
}

export function PartyPanel({ party }: PartyPanelProps) {
  return (
    <div
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 8,
        padding: 12,
        color: 'white',
        fontFamily: 'monospace',
        border: '2px solid #555',
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 'bold', borderBottom: '1px solid #777', paddingBottom: 4 }}>
        POKéMON PARTY ({party.length}/6)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {party.map((p, idx) => {
          const species = (pokemonData as any)[p.speciesId];
          const hpPercent = (p.currentHp / (species.BaseStats[0] * 2)) * 100; // simplified max HP for now

          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#333',
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid #444',
                minWidth: 200,
              }}
            >
              <img
                src={`/assets/sprites/pokemon/front/${p.speciesId.toLowerCase()}.png`}
                alt={p.speciesId}
                style={{ width: 40, height: 40, marginRight: 8, imageRendering: 'pixelated' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/sprites/pokemon/front/bulbasaur.png';
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>{p.nickname || species.Name}</span>
                  <span style={{ fontSize: 12, color: '#aaa' }}>Lv{p.level}</span>
                </div>
                <div style={{ background: '#222', height: 6, borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      background: hpPercent > 50 ? '#2ecc71' : hpPercent > 20 ? '#f1c40f' : '#e74c3c',
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, hpPercent))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {party.length === 0 && (
          <div style={{ fontStyle: 'italic', color: '#888', padding: '8px 0' }}>
            Your party is empty. Walk in tall grass!
          </div>
        )}
      </div>
    </div>
  );
}
