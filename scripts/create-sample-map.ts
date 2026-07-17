import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAPS_DIR = path.resolve(__dirname, '../apps/client/public/assets/maps');
const TILESETS_DIR = path.resolve(__dirname, '../apps/client/public/assets/tilesets');

// Ensure directories exist
fs.mkdirSync(MAPS_DIR, { recursive: true });
fs.mkdirSync(TILESETS_DIR, { recursive: true });

// 1. Create the Tiled tileset JSON (.tsj)
const tsjContent = {
  "columns": 8,
  "image": "../tilesets/outside.png",
  "imageheight": 16064,
  "imagewidth": 256,
  "margin": 0,
  "name": "outside",
  "spacing": 0,
  "tilecount": 4016,
  "tiledversion": "1.10.1",
  "tileheight": 32,
  "tilewidth": 32,
  "type": "tileset",
  "version": "1.10"
};

fs.writeFileSync(path.join(TILESETS_DIR, 'outside.tsj'), JSON.stringify(tsjContent, null, 2));
console.log('✅ Created outside.tsj');

// 2. Create a basic map (.tmj) - 25x19 (800x608)
// Grass tile ID in Outside.png might be 15 (if we look at top rows, actually tile IDs are 0-indexed in tsj but 1-indexed in map data).
// Let's assume ID 14 is grass.
const width = 25;
const height = 19;
const grassTile = 15; // grass
const treeTile = 52;  // tree top

const backgroundData = new Array(width * height).fill(grassTile);
const foregroundData = new Array(width * height).fill(0);

// Add some trees as obstacles (a simple border)
for (let x = 0; x < width; x++) {
  foregroundData[0 * width + x] = treeTile; // top edge
  foregroundData[(height - 1) * width + x] = treeTile; // bottom edge
}
for (let y = 0; y < height; y++) {
  foregroundData[y * width + 0] = treeTile; // left edge
  foregroundData[y * width + (width - 1)] = treeTile; // right edge
}
// Add a tree in the middle
foregroundData[5 * width + 5] = treeTile;
foregroundData[5 * width + 6] = treeTile;

const tmjContent = {
  "compressionlevel": -1,
  "height": height,
  "infinite": false,
  "layers": [
    {
      "data": backgroundData,
      "height": height,
      "id": 1,
      "name": "Background",
      "opacity": 1,
      "type": "tilelayer",
      "visible": true,
      "width": width,
      "x": 0,
      "y": 0
    },
    {
      "data": foregroundData,
      "height": height,
      "id": 2,
      "name": "Foreground",
      "opacity": 1,
      "type": "tilelayer",
      "visible": true,
      "width": width,
      "x": 0,
      "y": 0
    }
  ],
  "nextlayerid": 3,
  "nextobjectid": 1,
  "orientation": "orthogonal",
  "renderorder": "right-down",
  "tiledversion": "1.10.1",
  "tileheight": 32,
  "tilesets": [
    {
      "firstgid": 1,
      "source": "../tilesets/outside.tsj"
    }
  ],
  "tilewidth": 32,
  "type": "map",
  "version": "1.10",
  "width": width
};

fs.writeFileSync(path.join(MAPS_DIR, 'pallet-town.tmj'), JSON.stringify(tmjContent, null, 2));
console.log('✅ Created pallet-town.tmj');
