import Phaser from 'phaser';
import soundManager from '../systems/SoundManager.js';
import { ERAS, RANKS, ECO_FACTS, ECO_CHRONICLES } from '../data/ecoData.js';

const FONT_H = 'Cinzel, Georgia, serif';
const FONT_B = 'Lora, Georgia, serif';

export default class EcoFinalScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EcoFinalScene' });
  }

  init(data) {
    const d = data || {};
    this.stats = Object.assign({ aral: 0, health: 0, awareness: 0 }, d.stats || {});
    this.choices = Array.isArray(d.choices) ? d.choices : [];
  }

  create() {
    soundManager.stopWindAmbient();
    try { localStorage.removeItem('eco_mending_save'); } catch (e) {}
    this.cameras.main.fadeIn(900, 0, 0, 0);
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    soundManager.playVictoryFanfare();

    // Maximum achievable restoration within the limits of real history
    const maxStat = { aral: 0, health: 0, awareness: 0 };
    ERAS.forEach(e => {
      const best = e.decision.options[0].effects;
      Object.keys(maxStat).forEach(k => { maxStat[k] += best[k] || 0; });
    });
    const maxScore = Math.round((maxStat.aral + maxStat.health + maxStat.awareness) / 3);
    const score = Math.round((this.stats.aral + this.stats.health + this.stats.awareness) / 3);
    const rank = RANKS.find(r => score >= r.min) || RANKS[RANKS.length - 1];

    this.drawBackground(w, h);

    const fade = [];
    const add = (obj) => { obj.setAlpha(0); fade.push(obj); return obj; };

    add(this.add.text(w / 2, 40, '◆ CHRONICLE COMPLETE ◆', {
      fontFamily: FONT_H, fontSize: '30px', color: '#FFD700', stroke: '#2A1506', strokeThickness: 4, letterSpacing: 5,
    }).setOrigin(0.5));
    add(this.add.text(w / 2, 76, 'YOU MENDED THE PAST — AS FAR AS HISTORY ALLOWS', {
      fontFamily: FONT_H, fontSize: '12px', color: '#C4A46C', letterSpacing: 3,
    }).setOrigin(0.5));

    add(this.add.text(w / 2, 140, `${score}%`, {
      fontFamily: FONT_H, fontSize: '66px', color: '#FFE8C0', stroke: '#2A1506', strokeThickness: 4,
    }).setOrigin(0.5));
    add(this.add.text(w / 2, 186, `TIMELINE RESTORATION  •  maximum achievable within real history: ${maxScore}%`, {
      fontFamily: FONT_H, fontSize: '11px', color: '#A0896C', letterSpacing: 2,
    }).setOrigin(0.5));

    const badge = this.add.graphics();
    badge.fillStyle(0x150800, 0.85); badge.fillRoundedRect(w / 2 - 190, 205, 380, 34, 17);
    badge.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(rank.color).color, 0.9);
    badge.strokeRoundedRect(w / 2 - 190, 205, 380, 34, 17);
    add(badge);
    add(this.add.text(w / 2, 222, `✦  RANK: ${rank.title}  ✦`, {
      fontFamily: FONT_H, fontSize: '14px', color: rank.color, letterSpacing: 2,
    }).setOrigin(0.5));

    // Meters
    const meters = [
      { label: 'ARAL SEA', v: this.stats.aral, c: 0x4A98B4, x: w / 2 - 330 },
      { label: 'PUBLIC HEALTH', v: this.stats.health, c: 0x7ABF5A, x: w / 2 - 110 },
      { label: 'PUBLIC VOICE', v: this.stats.awareness, c: 0xE0B040, x: w / 2 + 110 },
    ];
    meters.forEach(m => {
      add(this.add.text(m.x, 262, `${m.label}: ${Math.round(m.v)}`, {
        fontFamily: FONT_H, fontSize: '12px', color: '#E8D5B0', letterSpacing: 1,
      }));
      const g = this.add.graphics();
      g.fillStyle(0x3A2A18, 1); g.fillRect(m.x, 282, 200, 10);
      g.fillStyle(m.c, 1); g.fillRect(m.x, 282, Phaser.Math.Clamp(m.v, 0, 100) * 2, 10);
      g.lineStyle(1, 0x8B7355, 0.8); g.strokeRect(m.x, 282, 200, 10);
      add(g);
    });

    // Timeline of decisions
    add(this.add.text(w / 2, 322, 'YOUR HISTORICAL TIMELINE', {
      fontFamily: FONT_H, fontSize: '13px', color: '#C4A46C', letterSpacing: 3,
    }).setOrigin(0.5));
    ERAS.forEach((era, i) => {
      const y = 350 + i * 38;
      const ci = this.choices[i];
      const opt = era.decision.options[ci] || era.decision.options[2];
      const tag = ci === 0 ? { t: 'BEST CHOICE', c: '#7ABF5A' } : (ci === 1 ? { t: 'PARTIAL', c: '#E0B040' } : { t: 'MISSED', c: '#E05050' });
      const row = this.add.graphics();
      row.fillStyle(0x2A1506, 0.7); row.fillRoundedRect(w / 2 - 410, y - 14, 820, 30, 6);
      row.lineStyle(1, 0x8B7355, 0.4); row.strokeRoundedRect(w / 2 - 410, y - 14, 820, 30, 6);
      add(row);
      add(this.add.text(w / 2 - 395, y, `${era.year}`, { fontFamily: FONT_H, fontSize: '14px', color: '#FFD700' }).setOrigin(0, 0.5));
      add(this.add.text(w / 2 - 330, y, opt.verdict, { fontFamily: FONT_B, fontSize: '13px', color: '#E8D5B0' }).setOrigin(0, 0.5));
      add(this.add.text(w / 2 + 395, y, tag.t, { fontFamily: FONT_H, fontSize: '11px', color: tag.c, letterSpacing: 1 }).setOrigin(1, 0.5));
    });

    // Honest truth card
    const truth = this.add.graphics();
    truth.fillStyle(0x231206, 0.92); truth.fillRoundedRect(w / 2 - 410, 516, 820, 112, 10);
    truth.lineStyle(1.5, 0xD4AF37, 0.7); truth.strokeRoundedRect(w / 2 - 410, 516, 820, 112, 10);
    add(truth);
    add(this.add.text(w / 2, 536, '★  THE TRUTH OF HISTORY  ★', {
      fontFamily: FONT_H, fontSize: '12px', color: '#FFD700', letterSpacing: 3,
    }).setOrigin(0.5));
    add(this.add.text(w / 2, 580,
      'No complete undo exists: radioactive isotopes persist for millennia, and the Southern Aral basin could not be fully restored. ' +
      'Yet every timely action saves human lives and ecosystems. ' +
      'Remembering the past is the first step toward never repeating its mistakes.', {
        fontFamily: FONT_B, fontSize: '13px', color: '#F0E4C8', align: 'center', wordWrap: { width: 780 }, lineSpacing: 4,
      }).setOrigin(0.5));

    add(this.add.text(w / 2, 652, ECO_FACTS.join('\n'), {
      fontFamily: FONT_B, fontSize: '11px', color: '#A0896C', align: 'center', lineSpacing: 3, fontStyle: 'italic',
    }).setOrigin(0.5, 0));

    this.tweens.add({ targets: fade, alpha: 1, duration: 800, delay: 400 });

    // Buttons
    this.makeButton(w / 2 - 280, 738, 220, 36, 'MAIN MENU', () => this.go('MenuScene'));
    this.makeButton(w / 2, 738, 280, 36, '📜 HISTORICAL CHRONICLES', () => this.showChroniclesModal(w, h), true);
    this.makeButton(w / 2 + 280, 738, 220, 36, 'PLAY AGAIN', () => this.go('EcoScene', { newGame: true }));
  }

  go(key, data) {
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(650, () => this.scene.start(key, data));
  }

  makeButton(x, y, bw, bh, label, onClick, isGold = false) {
    const bg = this.add.graphics();
    const draw = (hover) => {
      bg.clear();
      bg.fillStyle(hover ? 0x5C3A1E : (isGold ? 0x4A2E14 : 0x361F0F), 0.95);
      bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 8);
      bg.lineStyle(1.5, hover || isGold ? 0xFFD700 : 0x8B7355, 0.9);
      bg.strokeRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 8);
    };
    draw(false);
    this.add.text(x, y, label, {
      fontFamily: FONT_H, fontSize: '12px', color: isGold ? '#FFD700' : '#E8D5B0', letterSpacing: 1.5,
    }).setOrigin(0.5);
    const hit = this.add.rectangle(x, y, bw, bh, 0x000000, 0.01).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => draw(true));
    hit.on('pointerout', () => draw(false));
    hit.on('pointerdown', () => { soundManager.playPaperRustle(); onClick(); });
  }

  showChroniclesModal(w, h) {
    if (this.chroniclesModal) {
      this.chroniclesModal.destroy();
      this.chroniclesModal = null;
    }
    const pages = Array.isArray(ECO_CHRONICLES) && ECO_CHRONICLES.length ? ECO_CHRONICLES : [];
    let pageIdx = 0;

    const c = this.add.container(0, 0).setDepth(200);
    this.chroniclesModal = c;

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.82).setInteractive();
    const panelW = 860, panelH = 600, px = w / 2, py = h / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x231206, 0.98);
    panel.fillRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    panel.lineStyle(2, 0xD4AF37, 0.88);
    panel.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    panel.lineStyle(1, 0x8B7355, 0.35);
    panel.strokeRoundedRect(px - panelW / 2 + 10, py - panelH / 2 + 10, panelW - 20, panelH - 20, 10);

    const header = this.add.text(px, py - panelH / 2 + 34, '◆  HISTORICAL CHRONICLES OF THE STEPPE  ◆', {
      fontFamily: FONT_H, fontSize: '18px', color: '#FFD700', letterSpacing: 3,
    }).setOrigin(0.5);

    const chTitle = this.add.text(px, py - panelH / 2 + 74, '', {
      fontFamily: FONT_H, fontSize: '16px', color: '#FFE8C0', letterSpacing: 2,
    }).setOrigin(0.5);

    const chBody = this.add.text(px - 385, py - panelH / 2 + 112, '', {
      fontFamily: FONT_B, fontSize: '14px', color: '#E8D5B0', wordWrap: { width: 770 }, lineSpacing: 6,
    });

    const termsBox = this.add.graphics();
    const termsHeader = this.add.text(px - 385, py + 70, 'KEY HISTORICAL CONCEPTS & TERMS:', {
      fontFamily: FONT_H, fontSize: '11px', color: '#C4A46C', letterSpacing: 1.5,
    });
    const termsTxt = this.add.text(px - 385, py + 94, '', {
      fontFamily: FONT_B, fontSize: '12.5px', color: '#7ABF5A', wordWrap: { width: 770 }, lineSpacing: 4,
    });

    const pageCounter = this.add.text(px, py + panelH / 2 - 74, '', {
      fontFamily: FONT_H, fontSize: '12px', color: '#C4A46C', letterSpacing: 2,
    }).setOrigin(0.5);

    const renderPage = () => {
      const p = pages[pageIdx] || { title: '', body: '', terms: [] };
      chTitle.setText(p.title);
      chBody.setText(p.body);
      termsBox.clear();
      if (p.terms && p.terms.length) {
        termsBox.fillStyle(0x160B03, 0.9);
        termsBox.fillRoundedRect(px - 395, py + 58, 790, 118, 8);
        termsBox.lineStyle(1, 0x8B7355, 0.6);
        termsBox.strokeRoundedRect(px - 395, py + 58, 790, 118, 8);
        termsHeader.setVisible(true);
        termsTxt.setVisible(true).setText(p.terms.map(t => `• ${t}`).join('\n'));
      } else {
        termsHeader.setVisible(false);
        termsTxt.setVisible(false).setText('');
      }
      pageCounter.setText(`CHAPTER ${pageIdx + 1} OF ${pages.length}`);
    };

    const prevBtn = this.add.text(px - 190, py + panelH / 2 - 74, '◀ PREV', {
      fontFamily: FONT_H, fontSize: '13px', color: '#FFE8C0', letterSpacing: 1.5,
      backgroundColor: '#3D2B1A', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    prevBtn.on('pointerdown', () => {
      soundManager.playPaperRustle();
      pageIdx = (pageIdx - 1 + pages.length) % pages.length;
      renderPage();
    });

    const nextBtn = this.add.text(px + 190, py + panelH / 2 - 74, 'NEXT ▶', {
      fontFamily: FONT_H, fontSize: '13px', color: '#FFE8C0', letterSpacing: 1.5,
      backgroundColor: '#3D2B1A', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => {
      soundManager.playPaperRustle();
      pageIdx = (pageIdx + 1) % pages.length;
      renderPage();
    });

    const closeBtn = this.add.text(px, py + panelH / 2 - 30, '[ CLOSE CHRONICLES ]', {
      fontFamily: FONT_H, fontSize: '13px', color: '#FFD700', letterSpacing: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      soundManager.playPaperRustle();
      c.destroy();
      this.chroniclesModal = null;
    });

    c.add([overlay, panel, header, chTitle, chBody, termsBox, termsHeader, termsTxt, prevBtn, pageCounter, nextBtn, closeBtn]);
    renderPage();
  }

  drawBackground(w, h) {
    const g = this.add.graphics();
    g.fillStyle(0x0F0A06, 1); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) {
      g.fillStyle(0x4A98B4, 0.03 - i * 0.005);
      g.fillCircle(w / 2, 180, 160 + i * 70);
    }
    g.lineStyle(1.5, 0xC4A46C, 0.25); g.strokeRect(20, 20, w - 40, h - 40);
    g.lineStyle(1, 0x8B7355, 0.15); g.strokeRect(26, 26, w - 52, h - 52);

    this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: w }, y: { min: 0, max: h },
      lifespan: { min: 4000, max: 8000 }, speed: { min: 4, max: 15 },
      scale: { start: 0.7, end: 0 }, alpha: { start: 0.2, end: 0 },
      frequency: 300, quantity: 1, tint: 0x9FD8E8,
    }).setDepth(0);
  }
}

