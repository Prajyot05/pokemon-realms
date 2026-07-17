import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PE_DIR = path.resolve(__dirname, '../Pokemon Essentials v21.1 2023-07-30/PBS');
const SERVER_DATA_DIR = path.resolve(__dirname, '../apps/server/src/data');
const SHARED_DATA_DIR = path.resolve(__dirname, '../packages/shared/src/data');

fs.mkdirSync(SERVER_DATA_DIR, { recursive: true });
fs.mkdirSync(SHARED_DATA_DIR, { recursive: true });

function parseINI(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const result: Record<string, any> = {};
  let currentKey: string | null = null;
  
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    
    if (line.startsWith('[') && line.endsWith(']')) {
      currentKey = line.substring(1, line.length - 1);
      result[currentKey] = {};
    } else if (currentKey && line.includes('=')) {
      const splitIndex = line.indexOf('=');
      const propName = line.substring(0, splitIndex).trim();
      let propValue = line.substring(splitIndex + 1).trim();
      
      // Basic type inference
      if (propValue.includes(',')) {
        // array
        const arr = propValue.split(',').map(s => s.trim());
        // Try parsing as numbers if they are numbers
        result[currentKey][propName] = arr.map(v => isNaN(Number(v)) ? v : Number(v));
      } else {
        result[currentKey][propName] = isNaN(Number(propValue)) ? propValue : Number(propValue);
      }
    }
  }
  return result;
}

// 1. Parse pokemon.txt
console.log('Parsing pokemon.txt...');
const pokemonData = parseINI(path.join(PE_DIR, 'pokemon.txt'));
fs.writeFileSync(path.join(SERVER_DATA_DIR, 'pokemon.json'), JSON.stringify(pokemonData, null, 2));
fs.writeFileSync(path.join(SHARED_DATA_DIR, 'pokemon.json'), JSON.stringify(pokemonData, null, 2));

// 2. Parse moves.txt
console.log('Parsing moves.txt...');
const movesData = parseINI(path.join(PE_DIR, 'moves.txt'));
fs.writeFileSync(path.join(SERVER_DATA_DIR, 'moves.json'), JSON.stringify(movesData, null, 2));
fs.writeFileSync(path.join(SHARED_DATA_DIR, 'moves.json'), JSON.stringify(movesData, null, 2));

// 3. Parse types.txt
console.log('Parsing types.txt...');
const typesData = parseINI(path.join(PE_DIR, 'types.txt'));
fs.writeFileSync(path.join(SERVER_DATA_DIR, 'types.json'), JSON.stringify(typesData, null, 2));
fs.writeFileSync(path.join(SHARED_DATA_DIR, 'types.json'), JSON.stringify(typesData, null, 2));

console.log('✅ PBS parsing complete! Exported to JSON in server/src/data and shared/src/data.');
