import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PE_DIR = path.resolve(__dirname, '../Pokemon Essentials v21.1 2023-07-30');
const CLIENT_ASSETS = path.resolve(__dirname, '../apps/client/public/assets');

const directoriesToCreate = [
  'tilesets',
  'sprites/characters',
  'sprites/pokemon/front',
  'sprites/pokemon/back',
  'battlebacks',
];

directoriesToCreate.forEach((dir) => {
  fs.mkdirSync(path.join(CLIENT_ASSETS, dir), { recursive: true });
});

function copyFile(src: string, dest: string) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

// 1. Copy Tileset
copyFile(
  path.join(PE_DIR, 'Graphics/Tilesets/Outside.png'),
  path.join(CLIENT_ASSETS, 'tilesets/outside.png')
);
console.log('✅ Copied Outside.png');

// 2. Copy Character Sprites
const charactersDir = path.join(PE_DIR, 'Graphics/Characters');
if (fs.existsSync(charactersDir)) {
  const files = fs.readdirSync(charactersDir);
  let count = 0;
  files.forEach((file) => {
    if (file.endsWith('.png') && (file.includes('boy') || file.includes('girl') || file.includes('NPC') || file.includes('trainer'))) {
      copyFile(
        path.join(charactersDir, file),
        path.join(CLIENT_ASSETS, `sprites/characters/${file.toLowerCase()}`)
      );
      count++;
    }
  });
  console.log(`✅ Copied ${count} character sprites`);
}

// 3. Copy Pokemon Sprites
const pokemonFrontDir = path.join(PE_DIR, 'Graphics/Pokemon/Front');
if (fs.existsSync(pokemonFrontDir)) {
  const files = fs.readdirSync(pokemonFrontDir);
  let count = 0;
  files.forEach((file) => {
    if (file.endsWith('.png')) {
      copyFile(
        path.join(pokemonFrontDir, file),
        path.join(CLIENT_ASSETS, `sprites/pokemon/front/${file.toLowerCase()}`)
      );
      count++;
    }
  });
  console.log(`✅ Copied ${count} pokemon front sprites`);
}

const pokemonBackDir = path.join(PE_DIR, 'Graphics/Pokemon/Back');
if (fs.existsSync(pokemonBackDir)) {
  const files = fs.readdirSync(pokemonBackDir);
  let count = 0;
  files.forEach((file) => {
    if (file.endsWith('.png')) {
      copyFile(
        path.join(pokemonBackDir, file),
        path.join(CLIENT_ASSETS, `sprites/pokemon/back/${file.toLowerCase()}`)
      );
      count++;
    }
  });
  console.log(`✅ Copied ${count} pokemon back sprites`);
}

// 4. Copy Battlebacks
const battlebacksDir = path.join(PE_DIR, 'Graphics/Battlebacks');
if (fs.existsSync(battlebacksDir)) {
  const files = fs.readdirSync(battlebacksDir);
  let count = 0;
  files.forEach((file) => {
    if (file.endsWith('.png')) {
      copyFile(
        path.join(battlebacksDir, file),
        path.join(CLIENT_ASSETS, `battlebacks/${file.toLowerCase()}`)
      );
      count++;
    }
  });
  console.log(`✅ Copied ${count} battlebacks`);
}

console.log('🎉 Asset copying complete!');
