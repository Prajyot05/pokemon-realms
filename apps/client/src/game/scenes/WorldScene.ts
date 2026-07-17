import Phaser from 'phaser';
import { networkManager } from '../network/NetworkManager';
import { useGameStore } from '../../stores/useGameStore';
import type { Direction } from '@pokemon-realms/shared';

export class WorldScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private playerSprites: Map<string, Phaser.GameObjects.Rectangle> = new Map();

  constructor() {
    super({ key: 'WorldScene' });
  }

  create() {
    // Dark green background to simulate grass
    this.cameras.main.setBackgroundColor('#2d5a27');

    // Draw a simple grid
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x3d7a37, 0.3);
    for (let x = 0; x <= 800; x += 32) {
      graphics.lineBetween(x, 0, x, 600);
    }
    for (let y = 0; y <= 600; y += 32) {
      graphics.lineBetween(0, y, 800, y);
    }

    this.cursors = this.input.keyboard!.createCursorKeys();

    // Connect to server (don't await — Phaser doesn't support async create)
    networkManager.connect().catch((err) => {
      console.error('Failed to connect to server:', err);
    });
  }

  private currentDirection: Direction | null = null;

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
        // Local player = red, others = blue
        const color = id === playerId ? 0xe74c3c : 0x3498db;
        sprite = this.add.rectangle(state.x, state.y, 28, 28, color);
        sprite.setOrigin(0, 0);
        this.playerSprites.set(id, sprite);
      }

      // Smooth interpolation toward server position
      const lerpFactor = 0.3;
      sprite.x += (state.x - sprite.x) * lerpFactor;
      sprite.y += (state.y - sprite.y) * lerpFactor;
    }
  }
}
