import Phaser from 'phaser';

export class BattleScene extends Phaser.Scene {
  private roomId!: string;
  private background!: Phaser.GameObjects.Image;
  private p1Sprite!: Phaser.GameObjects.Sprite;
  private p2Sprite!: Phaser.GameObjects.Sprite;

  constructor() {
    super('BattleScene');
  }

  init(data: { roomId: string }) {
    this.roomId = data.roomId;
    console.log('BattleScene initialized with room:', this.roomId);
  }

  preload() {
    // We would load PE sprites here
    // this.load.image('battleback', 'assets/battlebacks/field_bg.png');
    // this.load.image('pokemon_back', 'assets/sprites/pokemon/back/001.png');
    // this.load.image('pokemon_front', 'assets/sprites/pokemon/front/016.png');
  }

  create() {
    // Add background
    // this.background = this.add.image(400, 300, 'battleback').setDisplaySize(800, 600);
    this.add.rectangle(400, 300, 800, 600, 0x55aa55); // Temp green background

    this.add.text(400, 50, 'Battle!', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);

    // Mock sprites
    this.p1Sprite = this.add.sprite(200, 450, '').play('player_boy_up'); // Temp
    this.p2Sprite = this.add.sprite(600, 250, '').play('player_boy_down'); // Temp

    // Listen to network manager events for turn results
    window.addEventListener('BATTLE_TURN_RESULT', this.handleTurnResult.bind(this));
    window.addEventListener('BATTLE_END', this.handleBattleEnd.bind(this));
  }

  private async handleTurnResult(e: Event) {
    const customEvent = e as CustomEvent;
    const turnResult = customEvent.detail;
    
    // Process Event Queue sequentially
    for (const event of turnResult.events) {
      await this.playBattleEvent(event);
    }
  }

  private playBattleEvent(event: any): Promise<void> {
    return new Promise((resolve) => {
      // In Phase 3 UI, we will emit an event to the React UI to show the text
      window.dispatchEvent(new CustomEvent('BATTLE_UI_TEXT', { detail: event.text }));
      
      if (event.type === 'ANIMATION') {
        const attacker = event.sourceId === 'WILD' ? this.p2Sprite : this.p1Sprite;
        const target = event.targetId === 'WILD' ? this.p2Sprite : this.p1Sprite;
        
        // Simple tackle animation
        this.tweens.add({
          targets: attacker,
          x: target.x,
          y: target.y,
          duration: 150,
          yoyo: true,
          onComplete: () => resolve()
        });
      } else if (event.type === 'DAMAGE') {
        // Flash target red
        const target = event.targetId === 'WILD' ? this.p2Sprite : this.p1Sprite;
        this.tweens.add({
          targets: target,
          alpha: 0.2,
          yoyo: true,
          repeat: 3,
          duration: 100,
          onComplete: () => resolve()
        });
      } else {
        // Just wait a bit for text to be read
        setTimeout(resolve, 1000);
      }
    });
  }

  private handleBattleEnd(e: Event) {
    window.dispatchEvent(new CustomEvent('BATTLE_UI_TEXT', { detail: 'Battle Ended!' }));
    setTimeout(() => {
      this.scene.stop();
      this.scene.resume('WorldScene');
      // Tell React UI we are done
      window.dispatchEvent(new CustomEvent('BATTLE_ENDED_PHASER'));
    }, 3000);
  }

  destroy() {
    window.removeEventListener('BATTLE_TURN_RESULT', this.handleTurnResult.bind(this));
    window.removeEventListener('BATTLE_END', this.handleBattleEnd.bind(this));
  }
}
