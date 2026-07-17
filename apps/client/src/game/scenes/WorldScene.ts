import Phaser from 'phaser';
import { networkManager } from '../network/NetworkManager';
import { useGameStore } from '../../stores/useGameStore';
import type { Direction } from '@pokemon-realms/shared';

export class WorldScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private playerSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private currentDirection: Direction | null = null;

  constructor() {
    super({ key: 'WorldScene' });
  }

  preload() {
    // Load tileset image
    this.load.image('outside', 'assets/tilesets/outside.png');
    // Load Tiled map JSON
    this.load.tilemapTiledJSON('pallet-town', 'assets/maps/pallet-town.tmj');
    // Load player sprite (RMXP format: 4 cols x 4 rows, 128x192 total => 32x48 per frame)
    this.load.spritesheet('player', 'assets/sprites/characters/boy_run.png', {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    // 1. Create Map
    const map = this.make.tilemap({ key: 'pallet-town' });
    const tileset = map.addTilesetImage('outside', 'outside');
    
    if (tileset) {
      map.createLayer('Background', tileset, 0, 0);
      map.createLayer('Foreground', tileset, 0, 0);
    }

    // 2. Set up Camera
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setZoom(2); // 2x zoom for classic GBA feel

    // 3. Define Animations (based on RMXP layout)
    // Row 0: Down (frames 0-3)
    this.anims.create({ key: 'walk-down', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    // Row 1: Left (frames 4-7)
    this.anims.create({ key: 'walk-left', frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }), frameRate: 8, repeat: -1 });
    // Row 2: Right (frames 8-11)
    this.anims.create({ key: 'walk-right', frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }), frameRate: 8, repeat: -1 });
    // Row 3: Up (frames 12-15)
    this.anims.create({ key: 'walk-up', frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }), frameRate: 8, repeat: -1 });

    // 4. Set up Input
    this.cursors = this.input.keyboard!.createCursorKeys();

    // 5. Connect to Server
    networkManager.connect().catch((err) => {
      console.error('Failed to connect to server:', err);
    });
  }

  update() {
    // ── Send input to server ──
    let newDirection: Direction | null = null;
    
    if (this.cursors.up.isDown) {
      newDirection = 'up';
    } else if (this.cursors.down.isDown) {
      newDirection = 'down';
    } else if (this.cursors.left.isDown) {
      newDirection = 'left';
    } else if (this.cursors.right.isDown) {
      newDirection = 'right';
    }

    if (newDirection !== this.currentDirection) {
      this.currentDirection = newDirection;
      if (newDirection) {
        networkManager.sendMove(newDirection);
      } else {
        networkManager.sendStop();
      }
    }

    // ── Render all players from Zustand store ──
    const { players, playerId } = useGameStore.getState();

    // Remove sprites for players that left
    for (const [id, sprite] of this.playerSprites) {
      if (!players.has(id)) {
        sprite.destroy();
        this.playerSprites.delete(id);
      }
    }

    // Create or update sprites for current players
    for (const [id, state] of players) {
      let sprite = this.playerSprites.get(id);

      if (!sprite) {
        // Create new sprite
        sprite = this.add.sprite(state.x, state.y, 'player');
        // Center horizontally, align bottom (since sprite is 48px tall and tile is 32px)
        sprite.setOrigin(0.5, 1);
        this.playerSprites.set(id, sprite);

        // Make camera follow local player
        if (id === playerId) {
          this.cameras.main.startFollow(sprite, true, 0.1, 0.1);
        }
      }

      // Smooth interpolation toward server position
      const lerpFactor = 0.3;
      const dx = state.x - sprite.x;
      const dy = state.y - sprite.y;
      
      sprite.x += dx * lerpFactor;
      sprite.y += dy * lerpFactor;

      // Animate based on movement
      const isMoving = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5;
      
      if (isMoving) {
        sprite.anims.play(`walk-${state.direction}`, true);
      } else {
        sprite.anims.stop();
        // Set idle frame based on direction
        switch (state.direction) {
          case 'down': sprite.setFrame(0); break;
          case 'left': sprite.setFrame(4); break;
          case 'right': sprite.setFrame(8); break;
          case 'up': sprite.setFrame(12); break;
        }
      }
      
      // Update depth so players sort correctly (Y-sorting)
      sprite.setDepth(sprite.y);
    }
  }
}
