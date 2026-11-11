import Phaser from 'phaser';
import soundManager from '../systems/SoundManager.js';
import { ECO_SAVE_KEY, ERAS } from '../data/ecoData.js';

const FONT_H = 'Cinzel, Georgia, serif';
const FONT_B = 'Lora, Georgia, serif';

export default class CampaignScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CampaignScene' });
  }

  create() {
    soundManager.stopWindAmbient();
    this.cameras.main.fadeIn(500, 0, 0, 0);
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.drawBackground(w, h);

    this.add.text(w / 2, 56, '◆  SELECT HISTORICAL CAMPAIGN  ◆', {
      fontFamily: FONT_H, fontSize: '30px', color: '#FFD700', stroke: '#2A1506', strokeThickness: 4, letterSpacing: 5,
    }).setOrigin(0.5);
    this.add.text(w / 2, 94, 'Two Perspectives on the History of 20th-Century Kazakhstan', {
      fontFamily: FONT_B, fontSize: '15px', color: '#A0896C', fontStyle: 'italic',
    }).setOrigin(0.5);

    const alash = this.getAlashStatus();
    const eco = this.getEcoStatus();

    this.createCard({
      x: w / 2 - 250, y: 130, cw: 460, ch: 540,
      accent: 0xC4A46C, accentHex: '#C4A46C', icon: 'alash',
      title: 'ARCHIVES OF ALASH',
      period: '1904 – 1917',
      desc: 'An investigation in a Kazakh village: find Abai’s lost manuscripts, question witnesses, connect clues, and deliver the nation’s literary heritage to the Alash leaders in Semey. Choose your companion wisely — not everyone can be trusted.',
      tags: 'DETECTIVE  •  DIALOGUES  •  DEDUCTION',
      status: alash,
      onContinue: () => this.go('GameScene'),
      onNew: () => {
        try { localStorage.removeItem('archives_of_alash_save'); } catch (e) {}
        this.go('IntroScene');
      },
    });

    this.createCard({
      x: w / 2 + 250, y: 130, cw: 460, ch: 540,
      accent: 0x4A98B4, accentHex: '#6FB4C4', icon: 'eco',
      title: 'MENDING THE PAST',
      period: 'ENVIRONMENTAL CRISES  1949 – 2005',
      desc: 'Travel across four historical eras: the Semipalatinsk Nuclear Polygon, the tragedy of the Aral Sea, the Nevada–Semipalatinsk movement, and the Kokaral Dam. Gather evidence, complete field tasks, and mitigate the damage as far as real history allows.',
      tags: 'TIME ERAS  •  GEIGER & RADAR  •  DECISIONS',
      status: eco,
      onContinue: () => this.go('EcoScene', { newGame: false }),
      onNew: () => this.go('EcoScene', { newGame: true }),
    });

    this.createSmallButton(w / 2, h - 50, '← BACK TO MAIN MENU', () => this.go('MenuScene'));
  }

  getAlashStatus() {
    try {
      const raw = localStorage.getItem('archives_of_alash_save');
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (!p.activeChapterId) return null;
      if (p.completedChapters && p.completedChapters.includes('ch6')) return null;
      const idx = parseInt(String(p.activeChapterId).replace('ch', ''), 10);
      return `Progress: Chapter ${isNaN(idx) ? '?' : idx} of 6`;
    } catch (e) {
      return null;
    }
  }

  getEcoStatus() {
    try {
      const raw = localStorage.getItem(ECO_SAVE_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (typeof p.era !== 'number' || p.era < 0 || p.era >= ERAS.length) return null;
      return `Progress: Era ${p.era + 1} of ${ERAS.length} (${ERAS[p.era].year})`;
    } catch (e) {
      return null;
    }
  }

  createCard(cfg) {
    const { x, y, cw, ch, accent } = cfg;
    const left = x - cw / 2;

    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35); g.fillRoundedRect(left + 4, y + 5, cw, ch, 14);
    g.fillStyle(0x24140A, 0.96); g.fillRoundedRect(left, y, cw, ch, 14);
    g.lineStyle(2, accent, 0.85); g.strokeRoundedRect(left, y, cw, ch, 14);
    g.lineStyle(1, accent, 0.25); g.strokeRoundedRect(left + 8, y + 8, cw - 16, ch - 16, 10);

    this.drawIcon(cfg.icon, x, y + 78, accent);

    this.add.text(x, y + 150, cfg.title, {
      fontFamily: FONT_H, fontSize: '26px', color: cfg.accentHex, stroke: '#2A1506', strokeThickness: 3, letterSpacing: 4,
    }).setOrigin(0.5);
    this.add.text(x, y + 186, cfg.period, {
      fontFamily: FONT_H, fontSize: '12px', color: '#E8D5B0', letterSpacing: 2, align: 'center', wordWrap: { width: cw - 40 },
    }).setOrigin(0.5);

    this.add.text(x, y + 262, cfg.desc, {
      fontFamily: FONT_B, fontSize: '14px', color: '#D4C5A9', align: 'center', wordWrap: { width: cw - 70 }, lineSpacing: 5,
    }).setOrigin(0.5);

    this.add.text(x, y + 346, cfg.tags, {
      fontFamily: FONT_H, fontSize: '10px', color: '#8B7355', letterSpacing: 2,
    }).setOrigin(0.5);

    if (cfg.status) {
      this.add.text(x, y + 378, cfg.status, {
        fontFamily: FONT_B, fontSize: '13px', color: '#7ABF5A', fontStyle: 'italic',
      }).setOrigin(0.5);
      this.createButton(x, y + ch - 100, 300, 44, 'CONTINUE', accent, cfg.onContinue);
      this.createButton(x, y + ch - 46, 300, 38, 'NEW GAME', accent, cfg.onNew, true);
    } else {
      this.createButton(x, y + ch - 70, 300, 48, 'START', accent, cfg.onNew);
    }
  }

  drawIcon(kind, cx, cy, accent) {
    const g = this.add.graphics();
    g.fillStyle(accent, 0.12); g.fillCircle(cx, cy, 52);
    g.lineStyle(1.5, accent, 0.6); g.strokeCircle(cx, cy, 52);
    if (kind === 'alash') {
      // Open manuscript
      g.fillStyle(0xE8D5B0, 1);
      g.fillRoundedRect(cx - 34, cy - 22, 32, 44, 3);
      g.fillRoundedRect(cx + 2, cy - 22, 32, 44, 3);
      g.lineStyle(1.5, 0x5C3A1E, 1);
      for (let i = 0; i < 5; i++) {
        g.lineBetween(cx - 28, cy - 12 + i * 8, cx - 8, cy - 12 + i * 8);
        g.lineBetween(cx + 8, cy - 12 + i * 8, cx + 28, cy - 12 + i * 8);
      }
      g.lineStyle(2, 0x8B7355, 1); g.lineBetween(cx, cy - 22, cx, cy + 22);
    } else {
      // Water drop + radiation trefoil
      g.fillStyle(0x4A98B4, 1);
      g.fillCircle(cx - 16, cy + 6, 14);
      g.fillTriangle(cx - 16, cy - 22, cx - 29, cy + 2, cx - 3, cy + 2);
      g.fillStyle(0xF0C020, 1); g.fillCircle(cx + 22, cy - 2, 20);
      g.lineStyle(2, 0x111111, 1); g.strokeCircle(cx + 22, cy - 2, 20);
      g.fillStyle(0x111111, 1);
      [-90, 30, 150].forEach(a => {
        const a1 = Phaser.Math.DegToRad(a - 30);
        const a2 = Phaser.Math.DegToRad(a + 30);
        g.fillTriangle(cx + 22, cy - 2,
          cx + 22 + Math.cos(a1) * 15, cy - 2 + Math.sin(a1) * 15,
          cx + 22 + Math.cos(a2) * 15, cy - 2 + Math.sin(a2) * 15);
      });
      g.fillStyle(0xF0C020, 1); g.fillCircle(cx + 22, cy - 2, 4);
    }
  }

  createButton(x, y, bw, bh, label, accent, onClick, secondary = false) {
    const bg = this.add.graphics();
    const draw = (hover) => {
      bg.clear();
      bg.fillStyle(hover ? 0x5C3A1E : (secondary ? 0x2A1A0E : 0x3D2B1A), 0.96);
      bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 8);
      bg.lineStyle(hover ? 2 : 1.5, hover ? 0xFFE8C0 : accent, secondary ? 0.55 : 0.9);
      bg.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 8);
    };
    draw(false);
    const t = this.add.text(x, y, label, {
      fontFamily: FONT_H, fontSize: secondary ? '13px' : '17px', color: secondary ? '#A0896C' : '#E8D5B0', letterSpacing: 3,
    }).setOrigin(0.5);
    const hit = this.add.rectangle(x, y, bw, bh, 0x000000, 0.01).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { draw(true); t.setColor('#FFE8C0'); });
    hit.on('pointerout', () => { draw(false); t.setColor(secondary ? '#A0896C' : '#E8D5B0'); });
    hit.on('pointerdown', () => { soundManager.playPaperRustle(); onClick(); });
  }

  createSmallButton(x, y, label, onClick) {
    const t = this.add.text(x, y, label, {
      fontFamily: FONT_H, fontSize: '14px', color: '#C4A46C', letterSpacing: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on('pointerover', () => t.setColor('#FFE8C0'));
    t.on('pointerout', () => t.setColor('#C4A46C'));
    t.on('pointerdown', onClick);
  }

  go(key, data) {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(550, () => this.scene.start(key, data));
  }

  drawBackground(w, h) {
    const g = this.add.graphics();
    g.fillStyle(0x120808, 1); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) {
      g.fillStyle(0xC4A46C, 0.035 - i * 0.006);
      g.fillCircle(w / 2, h / 2, 200 + i * 80);
    }
    g.lineStyle(1, 0xC4A46C, 0.2); g.strokeRect(30, 30, w - 60, h - 60);

    this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: w }, y: { min: 0, max: h },
      lifespan: { min: 4000, max: 8000 }, speed: { min: 3, max: 15 },
      scale: { start: 0.7, end: 0 }, alpha: { start: 0.15, end: 0 },
      frequency: 350, quantity: 1, tint: 0xC4A46C,
    }).setDepth(0);
  }
}

