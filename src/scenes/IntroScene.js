import Phaser from 'phaser';
import soundManager from '../systems/SoundManager.js';

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  create() {
    soundManager.stopWindAmbient();
    this.cameras.main.fadeIn(600, 0, 0, 0);
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.createBackground(w, h);

    // "◆ 1910 ◆" at top
    this.add.text(w / 2, 26, '◆  1910  ◆', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '13px',
      color: '#C4A46C',
      letterSpacing: 6,
    }).setOrigin(0.5).setAlpha(0.6);

    // Story text — static, no typewriter, always visible
    const storyLines = [
      'Semey, early 20th century.',
      '',
      'The writings of Abai Kunanbaiuly',
      'have inspired a generation',
      'of Kazakh intellectuals.',
      '',
      'The Alash movement dreams',
      'of a modern, educated nation.',
      '',
      'But handwritten manuscripts',
      'can easily be lost to time.',
      '',
      'You are a young scholar tasked',
      'with preserving an important',
      'manuscript before it disappears.',
    ];

    this.add.text(w / 2, 100, storyLines.join('\n'), {
      fontFamily: 'Lora, Georgia, serif',
      fontSize: '17px',
      color: '#D4C5A9',
      lineSpacing: 6,
      align: 'center',
      wordWrap: { width: 520 },
    }).setOrigin(0.5, 0);

    // Show the button after a short delay
    this.time.delayedCall(600, () => {
      this.showBeginButton(w, h);
    });
  }

  createBackground(w, h) {
    const bg = this.add.graphics();
    bg.fillStyle(0x120808);
    bg.fillRect(0, 0, w, h);

    // Warm central glow
    bg.fillStyle(0x2A1506, 0.3);
    bg.fillCircle(w / 2, h * 0.45, 280);

    // Subtle vertical lines
    bg.lineStyle(1, 0xC4A46C, 0.06);
    bg.lineBetween(w * 0.12, 0, w * 0.12, h);
    bg.lineBetween(w * 0.88, 0, w * 0.88, h);
  }

  showBeginButton(w, h) {
    const btnW = 260;
    const btnH = 52;
    const btnX = w / 2;
    const btnY = h - 90;

    // Decorative line
    const divG = this.add.graphics();
    divG.lineStyle(1, 0xC4A46C, 0.25);
    divG.lineBetween(w / 2 - 80, btnY - 30, w / 2 + 80, btnY - 30);
    divG.fillStyle(0xC4A46C, 0.35);
    divG.fillCircle(w / 2, btnY - 30, 2);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(0x3D2B1A, 0.92);
    bg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    bg.lineStyle(1.5, 0x8B7355, 0.7);
    bg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

    // Inner line
    bg.lineStyle(1, 0xC4A46C, 0.25);
    bg.strokeRoundedRect(btnX - btnW / 2 + 3, btnY - btnH / 2 + 3, btnW - 6, btnH - 6, 6);

    // Corner accent dots
    const dots = this.add.graphics();
    dots.fillStyle(0xC4A46C, 0.5);
    dots.fillCircle(btnX - btnW / 2 + 12, btnY, 4);
    dots.fillCircle(btnX + btnW / 2 - 12, btnY, 4);

    // Button label
    const label = this.add.text(btnX, btnY, 'BEGIN THE QUEST', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '18px',
      color: '#E8D5B0',
      letterSpacing: 3,
    }).setOrigin(0.5);

    // CLICKABLE HIT AREA — this is the key part
    const hitArea = this.add.rectangle(btnX, btnY, btnW, btnH, 0x3D2B1A, 0.01)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);

    // Hover effects
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x5C3A1E, 0.95);
      bg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      bg.lineStyle(2, 0xC4A46C, 0.9);
      bg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      label.setColor('#FFE8C0');
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x3D2B1A, 0.92);
      bg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      bg.lineStyle(1.5, 0x8B7355, 0.7);
      bg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      bg.lineStyle(1, 0xC4A46C, 0.25);
      bg.strokeRoundedRect(btnX - btnW / 2 + 3, btnY - btnH / 2 + 3, btnW - 6, btnH - 6, 6);
      label.setColor('#E8D5B0');
    });

    const startGame = () => {
      try {
        localStorage.removeItem('archives_of_alash_save');
      } catch (e) {}
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    };

    // Click and keyboard triggers
    hitArea.on('pointerdown', startGame);
    this.input.keyboard.once('keydown-SPACE', startGame);
    this.input.keyboard.once('keydown-ENTER', startGame);

    // Subtle pulse
    this.tweens.add({
      targets: label,
      alpha: { from: 1, to: 0.75 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}