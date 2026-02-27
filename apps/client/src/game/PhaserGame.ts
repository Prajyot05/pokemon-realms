import Phaser from 'phaser';
import { WorldScene } from './scenes/WorldScene';
import { GAME_WIDTH, GAME_HEIGHT } from '@pokemon-realms/shared';

let game: Phaser.Game | null = null;

export function initGame() {
  if (game) return;

  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: [WorldScene],
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    input: {
      keyboard: true,
    },
  });
}

export function destroyGame() {
  if (game) {
    game.destroy(true);
    game = null;
  }
}
