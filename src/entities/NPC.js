import Phaser from 'phaser';

export default class NPC extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, config) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.setSize(22, 22);
    this.setOffset(13, 18);
    this.setDepth(9);

    this.npcId = config.id;
    this.npcName = config.name;
    this.dialogKey = config.dialogKey;

    // Shadow beneath NPC
    this.shadow = scene.add.image(x, y + 3, 'shadow').setDepth(8).setAlpha(0.5).setScale(0.85);
    this.shadow.setTint(0x000000);

    // Idle bob tween
    scene.tweens.add({
      targets: [this, this.shadow],
      y: { from: y - 1, to: y + 1 },
      duration: 1800 + Math.random() * 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Name label with better styling
    this.nameLabel = scene.add.text(x, y - 30, config.name, {
      fontFamily: 'Lora, Georgia, serif',
      fontSize: '11px',
      color: '#E8D5B0',
      stroke: '#2A1506',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5, 1).setDepth(11);

    // Floating indicator dot above NPC
    this.createIndicator(scene, x, y);
  }

  createIndicator(scene, x, y) {
    // Small ornamental diamond indicator
    const indicator = scene.add.image(x, y - 26, 'ornament')
      .setDepth(11)
      .setScale(0.5)
      .setAlpha(0.7);

    scene.tweens.add({
      targets: indicator,
      alpha: { from: 0.7, to: 0.25 },
      y: { from: y - 26, to: y - 28 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.indicatorSprite = indicator;
    this.nameLabelObject = this.nameLabel;
  }

  updateShadowPosition() {
    if (this.shadow) {
      this.shadow.x = this.x;
      this.shadow.y = this.y + 3;
    }
    if (this.nameLabel) {
      this.nameLabel.x = this.x;
      this.nameLabel.y = this.y - 32;
    }
    if (this.indicatorSprite) {
      this.indicatorSprite.x = this.x;
    }
  }

  setNpcVisible(visible) {
    this.setVisible(visible);
    if (this.body) {
      this.body.enable = visible;
    }
    if (this.shadow) {
      this.shadow.setVisible(visible);
    }
    if (this.nameLabel) {
      this.nameLabel.setVisible(visible);
    }
    if (this.indicatorSprite) {
      this.indicatorSprite.setVisible(visible);
    }
  }

  getName() {
    return this.npcName;
  }

  getDialogKey() {
    return this.dialogKey;
  }
}