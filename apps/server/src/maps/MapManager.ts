import fs from 'fs';
import path from 'path';
import { CollisionGrid } from './CollisionGrid';

export class MapManager {
  private mapCache: Map<string, CollisionGrid> = new Map();

  loadMap(mapId: string): CollisionGrid {
    if (this.mapCache.has(mapId)) {
      return this.mapCache.get(mapId)!;
    }

    const mapPath = path.resolve(__dirname, `../../../../apps/client/public/assets/maps/${mapId}.tmj`);
    if (!fs.existsSync(mapPath)) {
      throw new Error(`Map file not found: ${mapPath}`);
    }

    const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
    
    // Find the Foreground layer (assuming this contains solid obstacles)
    const foregroundLayer = mapData.layers.find((layer: any) => layer.name === 'Foreground');
    if (!foregroundLayer) {
      throw new Error(`Map ${mapId} does not have a Foreground layer`);
    }

    const grid = new CollisionGrid(mapData.width, mapData.height, foregroundLayer.data);
    this.mapCache.set(mapId, grid);
    
    console.log(`🗺️  Loaded map: ${mapId} (${mapData.width}x${mapData.height})`);
    return grid;
  }
}

export const mapManager = new MapManager();
