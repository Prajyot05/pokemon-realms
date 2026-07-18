import { useState } from 'react';
import pokemonData from '@pokemon-realms/shared/src/data/pokemon.json';

const speciesList = Object.entries(pokemonData).map(([id, data]) => ({
  id,
  ...(data as any),
}));

export function Pokedex({ onClose }: { onClose: () => void }) {
  const [selectedId, setSelectedId] = useState<string>(speciesList[0].id);

  const selectedPokemon = speciesList.find((p) => p.id === selectedId);

  return (
    <div
      style={{
        position: 'fixed',
        top: '5%',
        left: '10%',
        width: '80%',
        height: '90%',
        background: '#e74c3c', // Pokedex Red
        border: '4px solid #c0392b',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'row',
        zIndex: 1000,
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        fontFamily: 'monospace',
        flexWrap: 'wrap', // Better responsiveness
      }}
    >
      {/* Left Panel - List */}
      <div
        style={{
          width: '100%',
          maxWidth: '300px',
          minWidth: '200px',
          background: '#f1c40f', // Inner yellow
          borderRight: '4px solid #c0392b',
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 30%',
        }}
      >
        <div style={{ padding: 12, background: '#c0392b', color: '#fff', fontWeight: 'bold' }}>
          POKéDEX ({speciesList.length})
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {speciesList.map((p, index) => (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              style={{
                padding: '8px',
                cursor: 'pointer',
                background: selectedId === p.id ? '#3498db' : 'transparent',
                color: selectedId === p.id ? '#fff' : '#333',
                borderRadius: 4,
                marginBottom: 4,
                fontWeight: selectedId === p.id ? 'bold' : 'normal',
              }}
            >
              #{String(index + 1).padStart(3, '0')} {p.Name}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Details */}
      <div
        style={{
          flex: '2 1 60%',
          padding: 24,
          background: '#ecf0f1',
          position: 'relative',
          color: '#333', // Fix legibility (name was white on light gray)
          overflowY: 'auto', // Allow scrolling for responsiveness
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: '#c0392b',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          CLOSE
        </button>

        {selectedPokemon && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 32 }}>
              <div
                style={{
                  background: '#fff',
                  border: '4px solid #bdc3c7',
                  borderRadius: 12,
                  width: 160,
                  height: 160,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <img
                  src={`/assets/sprites/pokemon/front/${selectedPokemon.Name.toLowerCase()}.png`}
                  alt={selectedPokemon.Name}
                  style={{ width: 120, height: 120, imageRendering: 'pixelated' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/sprites/pokemon/front/bulbasaur.png'; // Fallback
                  }}
                />
              </div>

              <div>
                <h1 style={{ margin: '0 0 16px 0', fontSize: 32 }}>{selectedPokemon.Name}</h1>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {([] as string[]).concat(selectedPokemon.Types || []).map((type: string) => (
                    <span
                      key={type}
                      style={{
                        padding: '4px 12px',
                        background: '#7f8c8d',
                        color: '#fff',
                        borderRadius: 16,
                        fontSize: 14,
                        fontWeight: 'bold',
                      }}
                    >
                      {type}
                    </span>
                  ))}
                </div>
                <div style={{ background: '#fff', padding: 16, borderRadius: 8, border: '2px solid #bdc3c7' }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>Base Stats</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>HP: {selectedPokemon.BaseStats?.[0] ?? '?'}</div>
                    <div>ATK: {selectedPokemon.BaseStats?.[1] ?? '?'}</div>
                    <div>DEF: {selectedPokemon.BaseStats?.[2] ?? '?'}</div>
                    <div>SPD: {selectedPokemon.BaseStats?.[3] ?? '?'}</div>
                    <div>SATK: {selectedPokemon.BaseStats?.[4] ?? '?'}</div>
                    <div>SDEF: {selectedPokemon.BaseStats?.[5] ?? '?'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
