import Phaser from 'phaser';
import { networkManager } from '../network/NetworkManager';
import { useGameStore } from '../../stores/useGameStore';
import { MOVE_SPEED, isValidDirection } from '@pokemon-realms/shared';
import type { Direction } from '@pokemon-realms/shared';

export class WorldScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private playerSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private currentDirection: Direction | null = null;
  private isBattling: boolean = false;
  private isEncountering: boolean = false;

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
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 5. Connect to Server
    const token = localStorage.getItem('jwt') || undefined;
    networkManager.connect('pallet-town', token).catch((err) => {
      console.error('Failed to connect to server:', err);
    });

    // Pre-battle freeze
    window.addEventListener('BATTLE_ENCOUNTER_START', () => {
      this.isEncountering = true;
    });

    window.addEventListener('BATTLE_START_PHASER', (e: Event) => {
      const customEvent = e as CustomEvent;
      const roomId = customEvent.detail.roomId;
      
      this.isBattling = true;
      this.isEncountering = false;
      this.currentDirection = null; // Stop moving
      
      // Classic Pokemon battle transition: Flash screen white
      this.cameras.main.flash(500, 255, 255, 255, false, (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress === 1) {
          // Launch battle scene as an overlay (WorldScene keeps running in background)
          this.scene.launch('BattleScene', { roomId });
        }
      });
    });
    
    window.addEventListener('BATTLE_ENDED_PHASER', () => {
      this.isBattling = false;
      this.isEncountering = false;
    });
  }

  update() {
    // ── Input Handling (Local Player Only) ──
    let newDirection: Direction | null = null;
    if (this.cursors.left.isDown) newDirection = 'left';
    else if (this.cursors.right.isDown) newDirection = 'right';
    else if (this.cursors.up.isDown) newDirection = 'up';
    else if (this.cursors.down.isDown) newDirection = 'down';

    // Check if dialog or battle is active, block movement if so
    const { activeDialog } = useGameStore.getState();
    if (activeDialog || this.isBattling || this.isEncountering) {
      newDirection = null;
    }

    if (newDirection !== this.currentDirection) {
      this.currentDirection = newDirection;
      if (newDirection) {
        networkManager.sendMove(newDirection);
      } else {
        networkManager.sendStop();
      }
    }

    // ── Render all players directly from Colyseus state ──
    const { playerId } = useGameStore.getState();
    const room = networkManager.getRoom();
    const serverPlayers = room?.state.players;

    if (!serverPlayers) return;

    // Remove sprites for players that left
    for (const [id, sprite] of this.playerSprites) {
      if (!serverPlayers.has(id)) {
        sprite.destroy();
        this.playerSprites.delete(id);
      }
    }

    // Create or update sprites for current players
    serverPlayers.forEach((state, id) => {
      let sprite = this.playerSprites.get(id);
      const dir = isValidDirection(state.direction) ? state.direction : 'down';

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

      let isMoving = false;
      let renderDir = dir;

      if (id === playerId) {
        // --- Client-Side Prediction for Local Player ---
        if (this.currentDirection) {
          isMoving = true;
          renderDir = this.currentDirection;
          switch (this.currentDirection) {
            case 'up': sprite.y -= MOVE_SPEED; break;
            case 'down': sprite.y += MOVE_SPEED; break;
            case 'left': sprite.x -= MOVE_SPEED; break;
            case 'right': sprite.x += MOVE_SPEED; break;
          }
        }
        
        // Reconciliation: Snap back if predicted position diverges too much from server
        const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, state.x, state.y);
        if (dist > 32) { // Tolerance threshold (1 tile)
          sprite.x = state.x;
          sprite.y = state.y;
        }
      } else {
        // --- Smooth Interpolation for Remote Players ---
        const lerpFactor = 0.3;
        const dx = state.x - sprite.x;
        const dy = state.y - sprite.y;
        
        sprite.x += dx * lerpFactor;
        sprite.y += dy * lerpFactor;
        
        isMoving = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5;
      }

      // Animate based on movement
      if (isMoving) {
        sprite.anims.play(`walk-${renderDir}`, true);
      } else {
        sprite.anims.stop();
        // Set idle frame based on direction
        switch (renderDir) {
          case 'down': sprite.setFrame(0); break;
          case 'left': sprite.setFrame(4); break;
          case 'right': sprite.setFrame(8); break;
          case 'up': sprite.setFrame(12); break;
        }
      }
      
      // Update depth so players sort correctly (Y-sorting)
      sprite.setDepth(sprite.y);
    });

    // ── Render all NPCs directly from Colyseus state ──
    const serverNpcs = room?.state.npcs;
    if (serverNpcs) {
      serverNpcs.forEach((npcState, id) => {
        let sprite = this.playerSprites.get(id); // Reuse the same sprite map for simplicity
        const dir = isValidDirection(npcState.direction) ? npcState.direction : 'down';

        if (!sprite) {
          sprite = this.add.sprite(npcState.x, npcState.y, 'player'); // Using player sprite for now as placeholder
          sprite.setOrigin(0.5, 1);
          this.playerSprites.set(id, sprite);
        }

        sprite.x = npcState.x;
        sprite.y = npcState.y;
        
        sprite.anims.stop();
        switch (dir) {
          case 'down': sprite.setFrame(0); break;
          case 'left': sprite.setFrame(4); break;
          case 'right': sprite.setFrame(8); break;
          case 'up': sprite.setFrame(12); break;
        }

        sprite.setDepth(sprite.y);
      });
    }

    // ── Check Interaction Input ──
    // JustPressed ensures we don't spam the server if the user holds the spacebar down
    if (!this.isBattling && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      networkManager.sendInteract();
    }
  }
}
