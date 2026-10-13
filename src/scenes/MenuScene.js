import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.cameras.main.fadeIn(600, 0, 0, 0);
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.createBackground(w, h);
    this.drawElaborateOrnamentalFrame(w, h);
    this.createAmbientParticles(w, h);

    this.createTitle(w, h);
    this.createOrnamentalDividers(w, h);

    this.time.delayedCall(1800, () => {
      this.createMenuButtons(w, h);
      this.addVersionText(w, h);
    });
  }

  createBackground(w, h) {
    // Deep dark brown base
    const bg = this.add.graphics();
    bg.setDepth(0);
    bg.fillStyle(0x120808);
    bg.fillRect(0, 0, w, h);

    // Subtle radial gradient effect (layered circles)
    for (let i = 0; i < 5; i++) {
      const alpha = 0.04 - i * 0.006;
      const radius = 180 + i * 80;
      bg.fillStyle(0xC4A46C, alpha);
      bg.fillCircle(w / 2, h / 2, radius);
    }

    // Parchment texture overlay
    for (let i = 0; i < 40; i++) {
      const px = Phaser.Math.Between(0, w);
      const py = Phaser.Math.Between(0, h);
      const size = Phaser.Math.Between(20, 60);
      bg.fillStyle(0xE8D5B0, Phaser.Math.FloatBetween(0.01, 0.035));
      bg.fillRect(px, py, size, size / 4);
    }

    // Subtle grain dots
    for (let i = 0; i < 80; i++) {
      const gx = Phaser.Math.Between(0, w);
      const gy = Phaser.Math.Between(0, h);
      bg.fillStyle(0xD4C5A9, Phaser.Math.FloatBetween(0.04, 0.08));
      bg.fillCircle(gx, gy, Phaser.Math.FloatBetween(0.5, 1.5));
    }
  }

  drawElaborateOrnamentalFrame(w, h) {
    const g = this.add.graphics().setDepth(0);
    const m = 30;
    const innerM = 50;

    // Outer border
    g.lineStyle(1, 0xC4A46C, 0.2);
    g.strokeRect(m, m, w - m * 2, h - m * 2);

    // Inner border
    g.lineStyle(1, 0xC4A46C, 0.15);
    g.strokeRect(innerM, innerM, w - innerM * 2, h - innerM * 2);

    // Corner ornaments - Kazakh "koshkar muyiz" (ram horn) inspired
    this.drawCornerOrnament(g, m, m, 1, 1);
    this.drawCornerOrnament(g, w - m, m, -1, 1);
    this.drawCornerOrnament(g, m, h - m, 1, -1);
    this.drawCornerOrnament(g, w - m, h - m, -1, -1);

    // Diamond pattern along borders
    const diamondSize = 10;
    const spacing = 40;

    // Top and bottom borders
    for (let x = innerM + spacing; x < w - innerM - spacing; x += spacing) {
      this.drawDiamond(g, x, innerM, diamondSize);
      this.drawDiamond(g, x, h - innerM, diamondSize);
    }

    // Left and right borders
    for (let y = innerM + spacing; y < h - innerM - spacing; y += spacing) {
      this.drawDiamond(g, innerM, y, diamondSize);
      this.drawDiamond(g, w - innerM, y, diamondSize);
    }
  }

  drawCornerOrnament(g, cx, cy, dx, dy) {
    const size = 24;
    g.lineStyle(1.5, 0xC4A46C, 0.5);

    // Main square
    g.strokeRect(cx - size / 2 * dx, cy - size / 2 * dy, size * dx, size * dy);

    // Inner diamond
    const d2 = size * 0.5;
    g.fillStyle(0xC4A46C, 0.15);
    g.fillRect(cx - d2 * dx, cy - d2 * dy, d2 * 2 * dx, d2 * 2 * dy);
    g.fillStyle(0xC4A46C, 0.2);
    g.fillCircle(cx, cy, 4);

    // Spiral lines (simplified ram horn)
    g.lineStyle(1, 0xC4A46C, 0.35);
    const pts = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 11) * Math.PI;
      const r = 8 + i * 1.2;
      pts.push({ x: cx + Math.cos(angle) * r * dx, y: cy + Math.sin(angle) * r * dy });
    }
    for (let i = 1; i < pts.length; i++) {
      g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    }
  }

  drawDiamond(g, x, y, size) {
    g.lineStyle(1, 0xC4A46C, 0.25);
    g.strokeRect(x - size / 2, y - size / 2, size, size);
    g.fillStyle(0xC4A46C, 0.08);
    g.fillRect(x - size / 2 + 1, y - size / 2 + 1, size - 2, size - 2);
    g.fillStyle(0xC4A46C, 0.15);
    g.fillCircle(x, y, 1.5);
  }

  createTitle(w, h) {
    const titleY = h * 0.2;

    // Title "ARCHIVES"
    const archivesText = this.add.text(w / 2, titleY, 'ARCHIVES', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '62px',
      color: '#C4A46C',
      stroke: '#2A1506',
      strokeThickness: 3,
      letterSpacing: 14,
    }).setOrigin(0.5).setAlpha(0).setScale(0.85);

    // Title "OF ALASH"
    const ofAlashText = this.add.text(w / 2, titleY + 68, 'OF ALASH', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '52px',
      color: '#E8D5B0',
      stroke: '#2A1506',
      strokeThickness: 2,
      letterSpacing: 12,
    }).setOrigin(0.5).setAlpha(0).setScale(0.85);

    // Subtitle
    const subtitleText = this.add.text(w / 2, titleY + 145, '" Preserve the Word. Preserve the Heritage. "', {
      fontFamily: 'Lora, Georgia, serif',
      fontSize: '17px',
      color: '#A0896C',
      fontStyle: 'italic',
      letterSpacing: 1,
    }).setOrigin(0.5).setAlpha(0);

    // Animate title in
    this.tweens.add({
      targets: archivesText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 1400,
      ease: 'Cubic.easeOut',
      delay: 300,
    });

    this.tweens.add({
      targets: ofAlashText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 1400,
      ease: 'Cubic.easeOut',
      delay: 600,
    });

    this.tweens.add({
      targets: subtitleText,
      alpha: 1,
      duration: 1000,
      ease: 'Cubic.easeOut',
      delay: 1200,
    });

    // Subtle glow behind title
    const titleGlow = this.add.circle(w / 2, titleY + 30, 160, 0xC4A46C, 0.04).setDepth(0);
    this.tweens.add({
      targets: titleGlow,
      alpha: { from: 0.04, to: 0.07 },
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createOrnamentalDividers(w, h) {
    const g = this.add.graphics().setDepth(0);
    const divY = h * 0.53;
    const divW = 180;

    // Ornamental line with diamond center
    g.lineStyle(1, 0xC4A46C, 0.2);
    g.lineBetween(w / 2 - divW, divY, w / 2 - 14, divY);
    g.lineBetween(w / 2 + 14, divY, w / 2 + divW, divY);

    // Center diamond ornament
    g.fillStyle(0xC4A46C, 0.3);
    g.fillRect(w / 2 - 6, divY - 6, 12, 12);
    g.lineStyle(1, 0xC4A46C, 0.4);
    g.strokeRect(w / 2 - 6, divY - 6, 12, 12);
    g.fillStyle(0xFFE8C0, 0.5);
    g.fillCircle(w / 2, divY, 3);

    // Small diamonds on ends
    g.fillStyle(0xC4A46C, 0.2);
    g.fillRect(w / 2 - divW - 5, divY - 5, 10, 10);
    g.fillRect(w / 2 + divW - 5, divY - 5, 10, 10);
  }

  createMenuButtons(w, h) {
    let hasSave = false;
    try {
      const raw = localStorage.getItem('archives_of_alash_save');
      if (raw) {
        const parsed = JSON.parse(raw);
        hasSave = !!parsed.activeChapterId && !(parsed.completedChapters && parsed.completedChapters.includes('ch6'));
      }
    } catch (e) {
      hasSave = false;
    }
    const btnW = 260;
    const btnH = 50;

    let groups = [];

    if (hasSave) {
      const btnY1 = h * 0.58;
      const btnY2 = h * 0.67;
      const btnY3 = h * 0.76;

      const continueBtn = this.createParchmentButton(w / 2, btnY1, btnW, btnH, 'CONTINUE', () => {
        this.transitionTo('GameScene');
      });

      const newGameBtn = this.createParchmentButton(w / 2, btnY2, btnW, btnH, 'NEW GAME', () => {
        try { localStorage.removeItem('archives_of_alash_save'); } catch (e) {}
        this.transitionTo('IntroScene');
      });

      const howBtn = this.createParchmentButton(w / 2, btnY3, btnW, btnH, 'HOW TO PLAY', () => {
        this.showHowToPlay(w, h);
      });

      groups = [continueBtn, newGameBtn, howBtn];
    } else {
      const btnY1 = h * 0.62;
      const btnY2 = h * 0.72;

      const startBtn = this.createParchmentButton(w / 2, btnY1, btnW, btnH, 'START GAME', () => {
        try { localStorage.removeItem('archives_of_alash_save'); } catch (e) {}
        this.transitionTo('IntroScene');
      });

      const howBtn = this.createParchmentButton(w / 2, btnY2, btnW, btnH, 'HOW TO PLAY', () => {
        this.showHowToPlay(w, h);
      });

      groups = [startBtn, howBtn];
    }

    groups.forEach((group, idx) => {
      group.visuals.forEach(item => item.setAlpha(0));
      this.tweens.add({
        targets: group.visuals,
        alpha: 1,
        duration: 600,
        ease: 'Cubic.easeOut',
        delay: 200 + idx * 150,
      });
    });
  }

  createParchmentButton(x, y, w, h, label, callback) {
    const visuals = [];

    // Button shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(x - w / 2 + 2, y - h / 2 + 3, w, h, 8);
    visuals.push(shadow);

    // Main button background (parchment look)
    const bg = this.add.graphics();
    bg.fillStyle(0x3D2B1A, 0.92);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    bg.lineStyle(1.5, 0x8B7355, 0.7);
    bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);

    // Inner highlight line
    bg.lineStyle(1, 0xC4A46C, 0.2);
    bg.strokeRoundedRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6, 6);
    visuals.push(bg);

    // Small ornament dots at corners
    const dotG = this.add.graphics();
    const dotSize = 4;
    dotG.fillStyle(0xC4A46C, 0.5);
    dotG.fillCircle(x - w / 2 + 12, y, dotSize);
    dotG.fillCircle(x + w / 2 - 12, y, dotSize);
    visuals.push(dotG);

    // Button text
    const text = this.add.text(x, y, label, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '19px',
      color: '#E8D5B0',
      letterSpacing: 3,
    }).setOrigin(0.5);
    visuals.push(text);

    // Interactive area — keep at alpha 1 always, use tiny fill alpha for Phaser input
    const hitArea = this.add.rectangle(x, y, w, h, 0x000000, 0.01)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x5C3A1E, 0.95);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      bg.lineStyle(2, 0xC4A46C, 0.9);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      bg.lineStyle(1, 0xE8D5B0, 0.3);
      bg.strokeRoundedRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6, 6);
      text.setColor('#FFE8C0');
      text.setScale(1.04);
      dotG.clear();
      dotG.fillStyle(0xFFE8C0, 0.7);
      dotG.fillCircle(x - w / 2 + 12, y, dotSize);
      dotG.fillCircle(x + w / 2 - 12, y, dotSize);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x3D2B1A, 0.92);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      bg.lineStyle(1.5, 0x8B7355, 0.7);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      bg.lineStyle(1, 0xC4A46C, 0.2);
      bg.strokeRoundedRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6, 6);
      text.setColor('#E8D5B0');
      text.setScale(1);
      dotG.clear();
      dotG.fillStyle(0xC4A46C, 0.5);
      dotG.fillCircle(x - w / 2 + 12, y, dotSize);
      dotG.fillCircle(x + w / 2 - 12, y, dotSize);
    });

    hitArea.on('pointerdown', () => callback());

    return { visuals, hitArea };
  }

  showHowToPlay(w, h) {
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.75)
      .setInteractive().setDepth(100);

    const panelW = 520;
    const panelH = 480;
    const px = w / 2;
    const py = h / 2;

    // Panel shadow
    const shadow = this.add.graphics().setDepth(101);
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillRoundedRect(px - panelW / 2 + 4, py - panelH / 2 + 4, panelW, panelH, 14);

    // Main panel
    const panel = this.add.graphics().setDepth(101);
    panel.fillStyle(0x2A1506, 0.97);
    panel.fillRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    panel.lineStyle(2, 0xC4A46C, 0.7);
    panel.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);

    // Inner ornamental border
    panel.lineStyle(1, 0x8B7355, 0.3);
    panel.strokeRoundedRect(px - panelW / 2 + 10, py - panelH / 2 + 10, panelW - 20, panelH - 20, 10);

    // Corner ornaments
    const corners = [
      [px - panelW / 2, py - panelH / 2],
      [px + panelW / 2, py - panelH / 2],
      [px - panelW / 2, py + panelH / 2],
      [px + panelW / 2, py + panelH / 2],
    ];
    corners.forEach(([cx, cy]) => {
      panel.fillStyle(0xC4A46C, 0.3);
      panel.fillRect(cx - 4, cy - 4, 8, 8);
    });

    const title = this.add.text(px, py - panelH / 2 + 40, '◆ HOW TO PLAY ◆', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '22px',
      color: '#C4A46C',
      letterSpacing: 3,
    }).setOrigin(0.5).setDepth(102);

    // Divider
    const div = this.add.graphics().setDepth(102);
    div.lineStyle(1, 0xC4A46C, 0.3);
    div.lineBetween(px - 120, py - panelH / 2 + 60, px + 120, py - panelH / 2 + 60);
    div.fillStyle(0xC4A46C, 0.4);
    div.fillCircle(px, py - panelH / 2 + 60, 2);

    const controls = [
      { key: 'W A S D / ARROWS', action: 'Move your scholar' },
      { key: 'E', action: 'Interact with people & clues' },
      { key: 'TAB', action: 'Open Case File & link clues' },
      { key: 'SPACE', action: 'Advance dialogue' },
      { key: 'ESC', action: 'Close menus and dialogue' },
    ];

    let cy = py - panelH / 2 + 88;
    controls.forEach(c => {
      const keyText = this.add.text(px - 110, cy, c.key, {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '12px',
        color: '#C4A46C',
      }).setDepth(102);
      const actionText = this.add.text(px + 10, cy, c.action, {
        fontFamily: 'Lora, Georgia, serif',
        fontSize: '13px',
        color: '#D4C5A9',
      }).setDepth(102);
      cy += 27;
    });

    // Separator
    const sepY = cy + 10;
    const sepG = this.add.graphics().setDepth(102);
    sepG.lineStyle(1, 0x8B7355, 0.2);
    sepG.lineBetween(px - 140, sepY, px + 140, sepY);

    const objective = this.add.text(px, sepY + 20, [
      'Search the village for the missing manuscript folios.',
      'Question the villagers, find hidden evidence, and use',
      'the Case File (TAB) to make deductive connections.',
      '',
      'Protect the 12 copyists of Abai\'s words and preserve',
      'the intellectual dawn of Kazakhstan.',
    ].join('\n'), {
      fontFamily: 'Lora, Georgia, serif',
      fontSize: '13px',
      color: '#A0896C',
      lineSpacing: 4,
      align: 'center',
      fontStyle: 'italic',
    }).setOrigin(0.5, 0).setDepth(102);

    const closeBtn = this.add.text(px, py + panelH / 2 - 40, '[ CLOSE ]', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '16px',
      color: '#C4A46C',
      letterSpacing: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(102);

    closeBtn.on('pointerover', () => closeBtn.setColor('#FFE8C0'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#C4A46C'));

    const closeAll = () => {
      [overlay, shadow, panel, title, div, ...this.children.list.filter(c => c.depth >= 102 && c.type === 'Text'),
        sepG, closeBtn].forEach(item => {
          if (item && item.destroy) item.destroy();
        });
    };

    closeBtn.on('pointerdown', closeAll);
    overlay.on('pointerdown', closeAll);
  }

  createAmbientParticles(w, h) {
    // Dust particles
    this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: w },
      y: { min: 0, max: h },
      lifespan: { min: 4000, max: 8000 },
      speed: { min: 3, max: 15 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.15, end: 0 },
      frequency: 350,
      quantity: 1,
      tint: 0xC4A46C,
    }).setDepth(0);

    // Occasional brighter particles
    this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: w },
      y: { min: 0, max: h },
      lifespan: { min: 5000, max: 10000 },
      speed: { min: 5, max: 20 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.2, end: 0 },
      frequency: 800,
      quantity: 1,
      tint: 0xFFE8C0,
    }).setDepth(0);
  }

  addVersionText(w, h) {
    this.add.text(w / 2, h - 28, 'An Educational Game • v1.0', {
      fontFamily: 'Lora, Georgia, serif',
      fontSize: '11px',
      color: '#6B5335',
      letterSpacing: 1,
    }).setOrigin(0.5);
  }

  transitionTo(sceneKey) {
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey);
    });
  }
}