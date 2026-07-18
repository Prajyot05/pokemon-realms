import Phaser from 'phaser';
import { networkManager } from '../network/NetworkManager';

export class BattleScene extends Phaser.Scene {
  private roomId!: string;
  private p1Sprite!: Phaser.GameObjects.Sprite;
  private p2Sprite!: Phaser.GameObjects.Sprite;
  private isFullscreen: boolean = false;

  constructor() {
    super('BattleScene');
  }

  preload() {
    this.load.image('battle_bg', 'assets/battlebacks/field_bg.png');
  }

  init(data: { roomId: string }) {
    this.roomId = data.roomId;
    console.log('BattleScene initialized with room:', this.roomId);
  }

  create() {
    // 1. Setup Camera (Overlay)
    const cw = this.cameras.main.width;
    const ch = this.cameras.main.height;
    
    // Bottom right positioning default
    const windowWidth = 600;
    const windowHeight = 400;
    
    // Set the camera viewport to match the window
    this.cameras.main.setViewport(cw - windowWidth - 20, ch - windowHeight - 20, windowWidth, windowHeight);

    // Add battle background
    this.add.image(0, 0, 'battle_bg').setOrigin(0, 0).setDisplaySize(windowWidth, windowHeight);

    const graphics = this.add.graphics();
    // Outer border (drawn from 0,0 since camera handles positioning)
    graphics.lineStyle(4, 0xffffff, 1);
    graphics.strokeRoundedRect(0, 0, windowWidth, windowHeight, 16);

    this.add.text(windowWidth / 2, 30, 'BATTLE START!', { fontSize: '24px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

    // Center camera on the 600x400 logical area
    this.cameras.main.centerOn(300, 200);

    // 2. Fetch Players and Load Sprites Dynamically
    const room = networkManager.battleRoom;
    if (!room) return;

    let p1Id = networkManager.getSessionId() || '';
    // Fix types
    const players = Array.from(room.state.players.entries()) as [string, any][];
    let myPlayer = players.find(([id, p]) => p.id !== 'WILD'); 
    let otherPlayer = players.find(([id, p]) => p.id === 'WILD') || players.find(([id, p]) => p.id !== myPlayer?.[0]);

    // Fallback if something is weird
    if (!myPlayer) myPlayer = players[0];
    if (!otherPlayer) otherPlayer = players[1];

    // Important: Fix CORS for PokeAPI
    this.load.crossOrigin = 'anonymous';

    if (myPlayer && otherPlayer) {
      const p1Species = myPlayer[1].activePokemon.speciesId.toLowerCase();
      const p2Species = otherPlayer[1].activePokemon.speciesId.toLowerCase();

      // PokeAPI URL format
      const p1Url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${this.getPokeDexNumber(p1Species)}.png`;
      const p2Url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${this.getPokeDexNumber(p2Species)}.png`;

      this.load.image('p1_sprite', p1Url);
      this.load.image('p2_sprite', p2Url);
      
      this.load.once('complete', () => {
        // Render Sprites relative to the 600x400 viewport
        this.p1Sprite = this.add.sprite(150, 250, 'p1_sprite').setScale(2);
        this.p2Sprite = this.add.sprite(450, 100, 'p2_sprite').setScale(2);
      });
      
      this.load.start();
    }

    // Listen to network manager events for turn results
    window.addEventListener('BATTLE_TURN_RESULT', this.handleTurnResult);
    window.addEventListener('BATTLE_END', this.handleBattleEnd);
    window.addEventListener('BATTLE_FULLSCREEN', this.handleFullscreen);
  }

  private handleFullscreen = (e: Event) => {
    const isFullscreen = (e as CustomEvent).detail;
    this.isFullscreen = isFullscreen;
    
    const cw = this.game.canvas.width;
    const ch = this.game.canvas.height;
    const windowWidth = 600;
    const windowHeight = 400;

    if (isFullscreen) {
      // Fullscreen: fill the screen and zoom in while maintaining aspect ratio
      const scale = Math.min(cw / windowWidth, ch / windowHeight);
      this.cameras.main.setViewport(0, 0, cw, ch);
      this.cameras.main.setZoom(scale);
      this.cameras.main.centerOn(300, 200);
    } else {
      // Bottom Right: default 1x zoom
      this.cameras.main.setViewport(cw - windowWidth - 20, ch - windowHeight - 20, windowWidth, windowHeight);
      this.cameras.main.setZoom(1);
      this.cameras.main.centerOn(300, 200);
    }
  }

  // Very basic mapper since speciesId is "PIDGEY", etc. PokeAPI uses lowercase names or numbers.
  private getPokeDexNumber(speciesName: string): number {
    const dex: Record<string, number> = {
      'bulbasaur': 1, 'charmander': 4, 'squirtle': 7, 
      'pidgey': 16, 'rattata': 19, 'pikachu': 25,
      // Add more as needed, but PokeAPI also accepts names directly!
    };
    return dex[speciesName] || 1; // Fallback to Bulbasaur
  }

  private handleTurnResult = async (e: Event) => {
    const customEvent = e as CustomEvent;
    const turnResult = customEvent.detail;
    
    for (const event of turnResult.events) {
      await this.playBattleEvent(event);
    }
  }

  private playBattleEvent(event: any): Promise<void> {
    return new Promise((resolve) => {
      window.dispatchEvent(new CustomEvent('BATTLE_UI_TEXT', { detail: event.text }));
      
      if (!this.p1Sprite || !this.p2Sprite) {
        setTimeout(resolve, 500);
        return;
      }

      if (event.type === 'ANIMATION') {
        const attacker = event.sourceId === 'WILD' ? this.p2Sprite : this.p1Sprite;
        const target = event.targetId === 'WILD' ? this.p2Sprite : this.p1Sprite;
        
        const originalX = attacker.x;
        const originalY = attacker.y;

        this.tweens.add({
          targets: attacker,
          x: target.x,
          y: target.y,
          duration: 150,
          yoyo: true,
          onComplete: () => resolve()
        });
      } else if (event.type === 'DAMAGE') {
        const target = event.targetId === 'WILD' ? this.p2Sprite : this.p1Sprite;
        window.dispatchEvent(new CustomEvent('BATTLE_UI_DAMAGE', { 
          detail: { targetId: event.targetId, amount: event.amount }
        }));
        this.tweens.add({
          targets: target,
          alpha: 0.2,
          yoyo: true,
          repeat: 3,
          duration: 100,
          onComplete: () => resolve()
        });
      } else {
        setTimeout(resolve, 1000);
      }
    });
  }

  private handleBattleEnd = (e: Event) => {
    window.dispatchEvent(new CustomEvent('BATTLE_UI_TEXT', { detail: 'Battle Ended!' }));
    setTimeout(() => {
      this.scene.stop();
      window.dispatchEvent(new CustomEvent('BATTLE_ENDED_PHASER'));
    }, 2000);
  }

  destroy() {
    window.removeEventListener('BATTLE_TURN_RESULT', this.handleTurnResult);
    window.removeEventListener('BATTLE_END', this.handleBattleEnd);
    window.removeEventListener('BATTLE_FULLSCREEN', this.handleFullscreen);
  }
}
