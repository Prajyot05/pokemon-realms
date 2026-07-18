import Phaser from 'phaser';
import { WorldScene } from './scenes/WorldScene';
import { BattleScene } from './scenes/BattleScene';
import { GAME_WIDTH, GAME_HEIGHT } from '@pokemon-realms/shared';

let game: Phaser.Game | null = null;

export function initGame() {
  if (game) return;

  game = new Phaser.Game({
    type: Phaser.AUTO,
    scale: {
      mode: Phaser.Scale.RESIZE,
      parent: 'game-container',
      width: '100%',
      height: '100%',
    },
    backgroundColor: '#000000',
    scene: [WorldScene, BattleScene],
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    input: {
      keyboard: true,
    },
    pixelArt: true, // Keep sprites crisp
  });
}

export function destroyGame() {
  if (game) {
    game.destroy(true);
    game = null;
  }
}
