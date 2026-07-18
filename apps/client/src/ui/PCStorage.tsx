import { useState } from 'react';
import { PokemonInstanceData } from '@pokemon-realms/shared';
import pokemonData from '@pokemon-realms/shared/src/data/pokemon.json';

interface PCStorageProps {
  pc: PokemonInstanceData[];
  onClose: () => void;
}

export function PCStorage({ pc, onClose }: PCStorageProps) {
  const [currentBox, setCurrentBox] = useState(0);

  const boxPokemon = pc.filter(p => p.boxNumber === currentBox);
  
  // Create a 30-slot array for the box (5 rows of 6)
  const slots = Array(30).fill(null);
  boxPokemon.forEach(p => {
    if (p.boxPosition !== null && p.boxPosition < 30) {
      slots[p.boxPosition] = p;
    }
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: '5%',
        left: '10%',
        width: '80%',
        height: '90%',
        background: '#34495e',
        border: '4px solid #2c3e50',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        fontFamily: 'monospace',
        color: '#fff',
      }}
    >
      <div style={{ padding: 16, borderBottom: '2px solid #2c3e50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>SOMEONE'S PC</h2>
        <button onClick={onClose} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
          CLOSE
        </button>
      </div>
      
      <div style={{ display: 'flex', padding: 16, gap: 24, flex: 1, overflow: 'hidden' }}>
        {/* Left Side: Stats/Preview */}
        <div style={{ width: '30%', background: '#2c3e50', borderRadius: 8, padding: 16 }}>
          <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid #7f8c8d', paddingBottom: 8 }}>Selected</h3>
          <div style={{ color: '#bdc3c7', fontStyle: 'italic' }}>
            Click a Pokémon in the box to view details.
          </div>
        </div>

        {/* Right Side: The Box */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, background: '#2ecc71', padding: '8px 16px', borderRadius: 8 }}>
            <button onClick={() => setCurrentBox(Math.max(0, currentBox - 1))} style={{ cursor: 'pointer' }}>◀</button>
            <strong style={{ color: '#000' }}>BOX {currentBox + 1}</strong>
            <button onClick={() => setCurrentBox(currentBox + 1)} style={{ cursor: 'pointer' }}>▶</button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(6, 1fr)', 
            gridTemplateRows: 'repeat(5, 1fr)',
            gap: 4,
            flex: 1,
            background: 'rgba(0,0,0,0.2)',
            padding: 8,
            borderRadius: 8
          }}>
            {slots.map((p, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: p ? 'pointer' : 'default',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                {p && (
                  <img
                    src={`/assets/sprites/pokemon/front/${p.speciesId.toLowerCase()}.png`}
                    alt={p.speciesId}
                    style={{ width: 48, height: 48, imageRendering: 'pixelated' }}
                    title={`Lv${p.level} ${(pokemonData as any)[p.speciesId]?.Name}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/sprites/pokemon/front/bulbasaur.png';
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
