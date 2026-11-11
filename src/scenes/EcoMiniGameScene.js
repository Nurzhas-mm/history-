import Phaser from 'phaser';
import soundManager from '../systems/SoundManager.js';
import { DEBATE_ROUNDS } from '../data/ecoData.js';

const FONT_H = 'Cinzel, Georgia, serif';
const FONT_B = 'Lora, Georgia, serif';

// Short descriptions shown before each mini-game starts.
const GAMES = {
  tuner: {
    title: 'CHRONOSCOPE DOSIMETER',
    how: 'Static interference is drowning out the future signal. Tune the frequency to the drifting wave and hold the lock.\n\n← → (or A / D) or mouse — adjust frequency.\nKeep the marker inside the green window until the lock meter reaches 100%.',
  },
  leaks: {
    title: 'CANAL CONCRETE LINING',
    how: 'The unlined earthen canal is losing water into the desert sand! Deliver water to the Syr Darya delta before time runs out.\n\nClick on the pulsing leaks to seal them with concrete.\nDeliver 100 units of water to the delta within 30 seconds.',
  },
  debate: {
    title: 'BREAKING THE INFORMATION BLOCKADE',
    how: 'Skeptical officials and journalists hesitate to sign the public appeal. Convince them by presenting the strongest evidence-backed argument.\n\nSelect an answer: 1 / 2 / 3 or click.\nConvince at least two out of three.',
  },
  dam: {
    title: 'THE KOKARAL DAM',
    how: 'Close the Berg Strait with a stone dam. The crane swings each block back and forth — drop it squarely onto the block below.\n\nSPACE (or click) — drop block.\nAny overhanging edge is sheared off. Stack 7 blocks.',
  },
};

export default class EcoMiniGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EcoMiniGameScene' });
  }

  init(data) {
    this.cfg = data || {};
    this.type = GAMES[this.cfg.type] ? this.cfg.type : 'tuner';
    this.stage = 'intro';
    this.tickFn = null;
    this.keyFn = null;
    this.closed = false;
  }

  create() {
    const w = 1024, h = 768;
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.8).setInteractive();

    const panel = this.add.graphics();
    panel.fillStyle(0x2A1506, 0.98); panel.fillRoundedRect(92, 94, 840, 580, 16);
    panel.lineStyle(2, 0xC4A46C, 0.9); panel.strokeRoundedRect(92, 94, 840, 580, 16);

    this.layer = this.add.container(0, 0);

    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.onKeyDown = (e) => { if (this.keyFn) this.keyFn(e); };
    this.input.keyboard.on('keydown', this.onKeyDown);
    this.events.once('shutdown', () => {
      try { this.input.keyboard.off('keydown', this.onKeyDown); } catch (e) {}
    });

    this.showIntro();
  }

  update(time, delta) {
    if (this.tickFn && this.stage === 'play') this.tickFn(time, delta / 1000);
  }

  // ---------- helpers ----------
  clearLayer() {
    this.tickFn = null;
    this.keyFn = null;
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.layer.removeAll(true);
  }

  txt(x, y, str, size = 14, color = '#E8D5B0', font = FONT_B, extra = {}) {
    const t = this.add.text(x, y, str, Object.assign({ fontFamily: font, fontSize: size + 'px', color }, extra)).setOrigin(0.5);
    this.layer.add(t);
    return t;
  }

  heading(title) {
    this.txt(512, 128, '◆  ' + title + '  ◆', 20, '#FFD700', FONT_H, { letterSpacing: 2 });
  }

  showIntro() {
    this.stage = 'intro';
    this.clearLayer();
    const g = GAMES[this.type];
    this.heading(g.title);
    this.txt(512, 330, g.how, 16, '#F0E4C8', FONT_B, { align: 'center', wordWrap: { width: 700 }, lineSpacing: 6 });
    const start = this.txt(512, 590, '[ SPACE — START ]      [ ESC — CANCEL ]', 15, '#FFE8C0', FONT_H, { letterSpacing: 2 });
    this.tweens.add({ targets: start, alpha: 0.45, duration: 700, yoyo: true, repeat: -1 });
    const hit = this.add.rectangle(512, 590, 480, 44, 0x000000, 0.01).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.startGame());
    this.layer.add(hit);
    this.keyFn = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') this.startGame();
      else if (e.code === 'Escape') this.close({ success: false, cancelled: true });
    };
  }

  startGame() {
    if (this.stage === 'play') return;
    this.clearLayer();
    this.stage = 'play';
    this.heading(GAMES[this.type].title);
    this['game_' + this.type]();
  }

  result(success, msg) {
    if (this.stage === 'result') return;
    this.stage = 'result';
    this.time.delayedCall(450, () => {
      this.clearLayer();
      this.stage = 'result';
      if (success) {
        soundManager.playVictoryFanfare();
        this.txt(512, 190, '◆  SUCCESS!  ◆', 30, '#7ABF5A', FONT_H, { letterSpacing: 4 });
        this.txt(512, 330, msg, 17, '#F0E4C8', FONT_B, { align: 'center', wordWrap: { width: 680 }, lineSpacing: 6 });
        const b = this.txt(512, 560, '[ SPACE — CONTINUE ]', 16, '#FFE8C0', FONT_H, { letterSpacing: 2 });
        this.tweens.add({ targets: b, alpha: 0.45, duration: 700, yoyo: true, repeat: -1 });
        const hit = this.add.rectangle(512, 560, 420, 44, 0x000000, 0.01).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => this.close({ success: true }));
        this.layer.add(hit);
        this.keyFn = (e) => { if (e.code === 'Space' || e.code === 'Enter') this.close({ success: true }); };
      } else {
        soundManager.playFailBuzz();
        this.txt(512, 190, '✖  ATTEMPT FAILED', 28, '#E06050', FONT_H, { letterSpacing: 3 });
        this.txt(512, 330, msg, 17, '#F0E4C8', FONT_B, { align: 'center', wordWrap: { width: 680 }, lineSpacing: 6 });
        const mk = (y, label, fn) => {
          const t = this.txt(512, y, label, 15, '#FFE8C0', FONT_H, { letterSpacing: 1, backgroundColor: '#5C3A1E', padding: { x: 16, y: 8 } });
          t.setInteractive({ useHandCursor: true });
          t.on('pointerdown', fn);
        };
        mk(470, '[ R ] RETRY', () => this.startGame());
        mk(520, '[ S ] SKIP (collect evidence without bonus)', () => this.close({ success: false, skipped: true }));
        mk(570, '[ ESC ] CANCEL', () => this.close({ success: false, cancelled: true }));
        this.keyFn = (e) => {
          if (e.code === 'KeyR') this.startGame();
          else if (e.code === 'KeyS') this.close({ success: false, skipped: true });
          else if (e.code === 'Escape') this.close({ success: false, cancelled: true });
        };
      }
    });
  }

  close(res) {
    if (this.closed) return;
    this.closed = true;
    const cb = this.cfg.onDone;
    this.scene.stop();
    if (cb) cb(res);
  }

  // ---------- Mini-game 1: dosimeter tuner (1949) ----------
  game_tuner() {
    const L = this.layer;
    const barX = 172, barW = 680, barY = 480;
    const g = this.add.graphics(); L.add(g);
    const hud = this.txt(512, 175, '', 15, '#FFE8C0', FONT_H);
    const st = { freq: 0.12, tt: 0, prog: 0, time: 35, clickT: 0, toneT: 0 };

    const setFromPointer = (p) => { st.freq = Phaser.Math.Clamp((p.x - barX) / barW, 0, 1); };
    const zone = this.add.rectangle(barX + barW / 2, barY, barW + 20, 80, 0x000000, 0.01).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', setFromPointer);
    zone.on('pointermove', (p) => { if (p.isDown) setFromPointer(p); });
    L.add(zone);

    this.txt(512, 548, '← → / A D / mouse: tune frequency', 13, '#A0896C');

    this.tickFn = (time, d) => {
      st.tt += d; st.time -= d;
      if (this.keys.left.isDown || this.keys.a.isDown) st.freq -= 0.5 * d;
      if (this.keys.right.isDown || this.keys.d.isDown) st.freq += 0.5 * d;
      st.freq = Phaser.Math.Clamp(st.freq, 0, 1);
      const target = Phaser.Math.Clamp(0.5 + 0.36 * Math.sin(st.tt * 0.6) + 0.1 * Math.sin(st.tt * 1.9 + 1), 0.06, 0.94);
      const err = Math.abs(st.freq - target);
      const q = Phaser.Math.Clamp(1 - err / 0.18, 0, 1);
      const locked = err < 0.06;
      st.prog = Phaser.Math.Clamp(st.prog + (locked ? d / 5 : -d / 14), 0, 1);

      g.clear();
      // oscilloscope
      g.fillStyle(0x0A1208, 1); g.fillRoundedRect(172, 215, 680, 150, 8);
      g.lineStyle(1, 0x2A4A2A, 0.8);
      for (let x = 172; x <= 852; x += 68) g.lineBetween(x, 215, x, 365);
      for (let y = 215; y <= 365; y += 30) g.lineBetween(172, y, 852, y);
      g.lineStyle(2, locked ? 0x7ABF5A : 0xF0C020, 1);
      g.beginPath();
      const amp = 8 + q * 40, noise = (1 - q) * 44 + 2;
      for (let x = 0; x <= 680; x += 5) {
        const y = 290 + Math.sin(x * 0.06 + st.tt * 7) * amp + (Math.random() - 0.5) * noise;
        if (x === 0) g.moveTo(172 + x, y); else g.lineTo(172 + x, y);
      }
      g.strokePath();

      // tuning bar
      g.fillStyle(0x1A0E06, 1); g.fillRoundedRect(barX - 10, barY - 32, barW + 20, 64, 8);
      g.lineStyle(1.5, 0x8B7355, 0.9); g.strokeRoundedRect(barX - 10, barY - 32, barW + 20, 64, 8);
      g.lineStyle(1, 0x5A4A38, 1);
      for (let i = 0; i <= 20; i++) g.lineBetween(barX + (i / 20) * barW, barY - 30, barX + (i / 20) * barW, barY - (i % 5 === 0 ? 16 : 22));
      g.fillStyle(locked ? 0x7ABF5A : 0x4A6A3A, 0.55);
      g.fillRect(barX + (target - 0.06) * barW, barY - 26, 0.12 * barW, 52);
      g.fillStyle(0xFFD700, 1); g.fillRect(barX + st.freq * barW - 3, barY - 32, 6, 64);

      // progress
      g.fillStyle(0x3A2A18, 1); g.fillRect(barX, 600, barW, 16);
      g.fillStyle(0x7ABF5A, 1); g.fillRect(barX, 600, barW * st.prog, 16);
      g.lineStyle(1.5, 0x8B7355, 1); g.strokeRect(barX, 600, barW, 16);

      hud.setText(`Time: ${Math.max(0, Math.ceil(st.time))}s   •   Signal Lock: ${Math.round(st.prog * 100)}%`);

      st.clickT -= d;
      if (st.clickT <= 0) {
        soundManager.playGeigerClick(0.05 + (1 - q) * 0.05);
        st.clickT = 0.05 + q * 0.45;
      }
      st.toneT -= d;
      if (st.toneT <= 0 && q > 0.15) {
        soundManager.playTone(260 + q * 640, 0.08, 'sine', 0.025 + q * 0.02);
        st.toneT = 0.16;
      }

      if (st.prog >= 1) this.result(true, 'Signal locked! The dosimeter decoded the fallout dose that will hit Dolon village. Data attached to the Memorandum.\n\nBonus: Public Health +4');
      else if (st.time <= 0) this.result(false, 'Interference was too strong — signal lost. Try locking onto the drifting frequency again.');
    };
  }

  // ---------- Mini-game 2: canal leaks (1960) ----------
  game_leaks() {
    const L = this.layer;
    const g = this.add.graphics(); L.add(g);
    const hud = this.txt(512, 175, '', 15, '#FFE8C0', FONT_H);
    const canalY = 400, x0 = 160, x1 = 864;
    const st = { time: 30, delivered: 0, spawnT: 0.6, leaks: [], sealed: [], flow: 0 };

    const spawn = () => {
      if (st.leaks.length >= 7) return;
      const x = Phaser.Math.Between(x0 + 60, x1 - 60);
      const top = Math.random() < 0.5;
      const y = canalY + (top ? -38 : 38);
      const body = this.add.circle(x, y, 17, 0x4A98B4, 0.95).setInteractive({ useHandCursor: true });
      body.setStrokeStyle(3, 0xBFE8F4, 1);
      const leak = { x, y, body, top };
      body.on('pointerdown', () => {
        if (this.stage !== 'play' || leak.dead) return;
        leak.dead = true;
        soundManager.playThud();
        st.leaks = st.leaks.filter(l => l !== leak);
        st.sealed.push({ x, y, life: 1 });
        this.tweens.killTweensOf(body);
        body.destroy();
      });
      L.add(body);
      st.leaks.push(leak);
      this.tweens.add({ targets: body, scale: 1.35, duration: 450, yoyo: true, repeat: -1 });
    };

    this.txt(512, 558, 'Click on pulsing canal breaches to seal them with concrete', 13, '#A0896C');

    this.tickFn = (time, d) => {
      st.time -= d;
      st.spawnT -= d;
      if (st.spawnT <= 0) {
        spawn();
        st.spawnT = Phaser.Math.FloatBetween(0.9, 1.5);
      }
      st.flow = Math.max(0, 7.5 - st.leaks.length * 1.5);
      st.delivered += st.flow * d;

      g.clear();
      // river source & delta
      g.fillStyle(0x347CA0, 1); g.fillRoundedRect(112, canalY - 40, 52, 80, 8);
      g.fillStyle(0x4A98B4, 1); g.fillRoundedRect(x1, canalY - 40, 56, 80, 8);
      g.fillStyle(0x8C7450, 1); g.fillRect(x0, canalY - 30, x1 - x0, 60);
      g.fillStyle(0x4A98B4, 0.95); g.fillRect(x0, canalY - 18, x1 - x0, 36);
      // flowing stripes
      g.fillStyle(0xBFE8F4, 0.35);
      for (let i = 0; i < 18; i++) {
        const sx = x0 + ((i * 44 + time * 0.12 * (st.flow + 1)) % (x1 - x0 - 30));
        g.fillRect(sx, canalY - 4 + (i % 3) * 5 - 5, 22, 3);
      }
      // sand losses under the canal
      g.fillStyle(0xD4BE86, 1); g.fillRect(x0, canalY + 60, x1 - x0, 90);
      g.fillStyle(0x6FB4C4, 0.5);
      st.leaks.forEach(l => {
        g.fillCircle(l.x, l.y + (l.top ? 0 : 22), 10 + (Math.sin(time * 0.01 + l.x) + 1) * 3);
      });
      // sealed concrete patches
      st.sealed.forEach(s => {
        g.fillStyle(0x9A9A92, 1); g.fillRoundedRect(s.x - 20, s.y - 10, 40, 20, 4);
        g.lineStyle(1.5, 0x5A5A52, 1); g.strokeRoundedRect(s.x - 20, s.y - 10, 40, 20, 4);
      });

      // delta meter
      const pct = Phaser.Math.Clamp(st.delivered / 100, 0, 1);
      g.fillStyle(0x3A2A18, 1); g.fillRect(172, 600, 680, 16);
      g.fillStyle(0x4A98B4, 1); g.fillRect(172, 600, 680 * pct, 16);
      g.lineStyle(1.5, 0x8B7355, 1); g.strokeRect(172, 600, 680, 16);

      hud.setText(`Time: ${Math.max(0, Math.ceil(st.time))}s   •   Delta Water: ${Math.min(100, Math.round(st.delivered))}/100   •   Active Leaks: ${st.leaks.length}`);

      if (st.delivered >= 100) this.result(true, 'The concrete-lined canal delivered water to the Syr Darya delta! The engineer attaches the calculations to the Memorandum.\n\nBonus: Aral Sea +6');
      else if (st.time <= 0) this.result(false, 'Too much water seeped into the desert sands. Seal the breaches faster — each leak drains nearly a fifth of the flow.');
    };
  }

  // ---------- Mini-game 3: debate / signatures (1989) ----------
  game_debate() {
    const L = this.layer;
    const rounds = DEBATE_ROUNDS;
    const st = { idx: 0, score: 0, busy: false };

    const render = () => {
      // keep heading, clear the rest
      this.layer.removeAll(true);
      this.heading(GAMES.debate.title);
      this.tweens.killAll();
      const r = rounds[st.idx];
      this.txt(512, 178, `Round ${st.idx + 1}/${rounds.length}  •  Convinced: ${st.score}`, 14, '#C4A46C', FONT_H);
      this.txt(512, 222, r.who, 17, '#FFD700', FONT_H);
      this.txt(512, 290, r.claim, 17, '#F0E4C8', FONT_B, { align: 'center', wordWrap: { width: 700 }, fontStyle: 'italic', lineSpacing: 5 });

      const opts = Phaser.Utils.Array.Shuffle(r.options.slice());
      const boxes = [];
      opts.forEach((opt, i) => {
        const by = 380 + i * 82, bw = 740, bh = 68;
        const bg = this.add.graphics();
        const draw = (fill, stroke) => {
          bg.clear();
          bg.fillStyle(fill, 0.96); bg.fillRoundedRect(512 - bw / 2, by, bw, bh, 10);
          bg.lineStyle(1.5, stroke, 0.9); bg.strokeRoundedRect(512 - bw / 2, by, bw, bh, 10);
        };
        draw(0x3D2B1A, 0x8B7355);
        const t = this.add.text(512 - bw / 2 + 18, by + bh / 2, `[${i + 1}]  ${opt.text}`, {
          fontFamily: FONT_B, fontSize: '15px', color: '#FFE8C0', wordWrap: { width: bw - 36 }, lineSpacing: 3,
        }).setOrigin(0, 0.5);
        const hit = this.add.rectangle(512, by + bh / 2, bw, bh, 0x000000, 0.01).setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => { if (!st.busy) draw(0x5C3A1E, 0xFFD700); });
        hit.on('pointerout', () => { if (!st.busy) draw(0x3D2B1A, 0x8B7355); });
        hit.on('pointerdown', () => choose(i));
        this.layer.add([bg, t, hit]);
        boxes.push({ draw, opt });
      });

      const choose = (i) => {
        if (st.busy || this.stage !== 'play' || !boxes[i]) return;
        st.busy = true;
        const ok = !!boxes[i].opt.ok;
        boxes.forEach((b, k) => {
          if (b.opt.ok) b.draw(0x2E5A2E, 0x7ABF5A);
          else if (k === i) b.draw(0x5A2A24, 0xE06050);
        });
        if (ok) { st.score++; soundManager.playClueChime(); } else { soundManager.playFailBuzz(); }
        this.txt(512, 640, ok ? '✔ ' + r.explain : '✖ Unconvincing argument. ' + r.explain, 14, ok ? '#7ABF5A' : '#E0A090', FONT_B, { align: 'center', wordWrap: { width: 720 } });
        this.time.delayedCall(1900, () => {
          st.idx++;
          st.busy = false;
          if (st.idx >= rounds.length) {
            if (st.score >= 2) this.result(true, `You convinced ${st.score} of ${rounds.length} interlocutors. Petition sheets fill with signatures — the public voice grows louder.\n\nBonus: Public Voice +6`);
            else this.result(false, `Only ${st.score} of ${rounds.length} convinced. Rely on hard evidence: medical statistics, mass petitions, and the poet's public appeal.`);
          } else {
            render();
          }
        });
      };

      this.keyFn = (e) => {
        const map = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 };
        if (map[e.code] !== undefined) choose(map[e.code]);
      };
    };
    render();
  }

  // ---------- Mini-game 4: Kokaral dam stacking (1991) ----------
  game_dam() {
    const L = this.layer;
    const g = this.add.graphics(); L.add(g);
    const hud = this.txt(512, 175, '', 15, '#FFE8C0', FONT_H);
    const baseY = 610, bh = 34, need = 7;
    const blocks = [{ x: 512, w: 300 }];
    const cur = { w: 300, x: 270, dir: 1, speed: 210 };
    const st = { dropping: false, flash: 0, perfect: 0 };
    const minC = 250, maxC = 774;

    const drop = () => {
      if (this.stage !== 'play' || st.dropping) return;
      const top = blocks[blocks.length - 1];
      const l = Math.max(cur.x - cur.w / 2, top.x - top.w / 2);
      const r = Math.min(cur.x + cur.w / 2, top.x + top.w / 2);
      const ov = r - l;
      if (ov <= 4) {
        st.dropping = true;
        soundManager.playFailBuzz();
        this.result(false, 'The block missed the foundation — the current washed it away. Aim more carefully!');
        return;
      }
      let nw = ov, nx = (l + r) / 2;
      if (Math.abs(cur.x - top.x) < 7) {
        nw = top.w; nx = top.x; st.perfect++;
        soundManager.playClueChime();
      } else {
        soundManager.playThud();
      }
      blocks.push({ x: nx, w: nw });
      if (blocks.length - 1 >= need) {
        st.dropping = true;
        this.result(true, `Dam completed${st.perfect ? ` (perfect drops: ${st.perfect})` : ''}! Syr Darya waters will now replenish the North Aral Sea.\n\nBonus: Aral Sea +6`);
        return;
      }
      cur.w = nw;
      cur.speed = 210 + (blocks.length - 1) * 24;
      cur.x = cur.dir > 0 ? minC : maxC;
    };

    const zone = this.add.rectangle(512, 400, 800, 400, 0x000000, 0.01).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', drop);
    L.add(zone);
    this.keyFn = (e) => { if (e.code === 'Space' || e.code === 'Enter') drop(); };

    this.tickFn = (time, d) => {
      if (!st.dropping) {
        cur.x += cur.dir * cur.speed * d;
        if (cur.x > maxC) { cur.x = maxC; cur.dir = -1; }
        if (cur.x < minC) { cur.x = minC; cur.dir = 1; }
      }
      g.clear();
      // strait: water and banks
      g.fillStyle(0x347CA0, 1); g.fillRect(130, 540, 764, 90);
      g.fillStyle(0x4A98B4, 0.7); g.fillRect(130, 540, 764, 22);
      g.fillStyle(0x8C7450, 1); g.fillRect(112, 360, 40, 270); g.fillRect(872, 360, 40, 270);
      g.fillStyle(0xB09A68, 1); g.fillRect(112, 630, 800, 26);
      // crane
      g.lineStyle(3, 0x3A2A18, 1);
      const curY = baseY - blocks.length * bh - bh - 28;
      g.lineBetween(cur.x, 205, cur.x, curY);
      g.lineBetween(160, 205, 864, 205);
      // stacked blocks
      blocks.forEach((b, i) => {
        const y = baseY - (i + 1) * bh;
        g.fillStyle(i % 2 ? 0x8A8478 : 0x6E685E, 1);
        g.fillRect(b.x - b.w / 2, y, b.w, bh);
        g.lineStyle(2, 0x3A352E, 1); g.strokeRect(b.x - b.w / 2, y, b.w, bh);
      });
      // moving block
      g.fillStyle(0xC4A46C, 1); g.fillRect(cur.x - cur.w / 2, curY, cur.w, bh);
      g.lineStyle(2, 0x5C3A1E, 1); g.strokeRect(cur.x - cur.w / 2, curY, cur.w, bh);

      hud.setText(`Blocks Stacked: ${blocks.length - 1}/${need}`);
    };
  }
}
