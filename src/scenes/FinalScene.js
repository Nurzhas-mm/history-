import Phaser from 'phaser';
import { HISTORY_CARDS } from '../data/chapters.js';
import soundManager from '../systems/SoundManager.js';

export default class FinalScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FinalScene' });
  }

  init(data = {}) {
    this.finalPoints = (data && data.points) !== undefined ? data.points : 100;
    this.finalRank = (data && data.rank) || 'HERITAGE KEEPER';
    this.finalEnding = (data && data.ending) || {
      ending: 'ГЕРОИЧЕСКИЙ ПУТЬ',
      endingText: 'Мужество и верность спасли духовное сокровище нации.'
    };
    this.epilogueText = (data && data.epilogueText) ||
      'Рукописи великого Абая и список двенадцати переписчиков благополучно переданы лидерам партии «Алаш» в городе Семей.';
    this.trust = (data && data.trust) !== undefined ? data.trust : 75;
  }

  create() {
    try {
      localStorage.removeItem('archives_of_alash_save');
    } catch (e) {}
    this.cameras.main.fadeIn(800, 0, 0, 0);
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    soundManager.playVictoryFanfare();

    this.createBackground(w, h);
    this.createOrnamentalFrame(w, h);
    this.createAmbientParticles(w, h);

    let delay = 250;

    // Top ornamental badge
    const topBadge = this.add.text(w / 2, 30, '❖  ҰЛЫ ЖЕҢІС  •  ВЕЛИКАЯ ПОБЕДА  ❖', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '12px',
      color: '#C4A46C',
      letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);

    // Main Glorious Celebration Header: ПОЗДРАВЛЯЕМ! СЛАВА ХРАНИТЕЛЮ НАСЛЕДИЯ!
    const titleText = this.add.text(w / 2, 60, '◆ ПОЗДРАВЛЯЕМ! СЛАВА ХРАНИТЕЛЮ НАСЛЕДИЯ! ◆', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '23px',
      color: '#FFD700',
      stroke: '#2A1506',
      strokeThickness: 4,
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0);

    const subText = this.add.text(w / 2, 88, 'РУКОПИСИ ВЕЛИКОГО АБАЯ И СПИСОК 12 ПЕРЕПИСЧИКОВ СПАСЕНЫ!', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      color: '#FFE8C0',
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0);

    // Decorative divider line
    const headerDiv = this.add.graphics().setAlpha(0);
    headerDiv.lineStyle(1.5, 0xC4A46C, 0.45);
    headerDiv.lineBetween(w * 0.12, 106, w * 0.88, 106);

    this.tweens.add({ targets: [topBadge, titleText, subText, headerDiv], alpha: 1, duration: 750, delay });
    delay += 450;

    // Praise Scroll / Parchment Card honoring the player's heroic deed
    const praiseCardW = 820;
    const praiseCardH = 120;
    const praiseCardY = 175;

    const praiseBox = this.add.graphics().setAlpha(0);
    praiseBox.fillStyle(0x231206, 0.92);
    praiseBox.fillRoundedRect(w / 2 - praiseCardW / 2, praiseCardY - praiseCardH / 2, praiseCardW, praiseCardH, 10);
    praiseBox.lineStyle(1.5, 0xD4AF37, 0.75);
    praiseBox.strokeRoundedRect(w / 2 - praiseCardW / 2, praiseCardY - praiseCardH / 2, praiseCardW, praiseCardH, 10);

    const praiseBadge = this.add.text(w / 2, praiseCardY - praiseCardH / 2 + 16, '★  ЧЕСТЬ И СЛАВА ДОБЛЕСТНОМУ ИССЛЕДОВАТЕЛЮ!  ★', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '13px',
      color: '#FFD700',
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0);

    const praiseText = this.add.text(w / 2, praiseCardY + 12,
      '«Слава тебе, верный хранитель степного слова! Ты преодолел опасности Степной дороги,\n' +
      'разоблачил коварство разбойников и царские заставы, доставив бесценные рукописи Абая\n' +
      'лидерам движения «Алаш» (Әлихан Бөкейханов, Ахмет Байтұрсынұлы) в город Семей.\n' +
      'Имена 12 переписчиков защищены, а духовный факел нации сохранен для потомков!»', {
      fontFamily: 'Lora, Georgia, serif',
      fontSize: '12px',
      color: '#F4E4C8',
      align: 'center',
      wordWrap: { width: praiseCardW - 40 },
      lineSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: [praiseBox, praiseBadge, praiseText], alpha: 1, duration: 750, delay });
    delay += 450;

    // Ending & Historical Epilogue Box
    const epiW = 820;
    const epiH = 96;
    const epiY = 296;

    const epiBox = this.add.graphics().setAlpha(0);
    epiBox.fillStyle(0x1C0E05, 0.88);
    epiBox.fillRoundedRect(w / 2 - epiW / 2, epiY - epiH / 2, epiW, epiH, 8);
    epiBox.lineStyle(1, 0x8B7355, 0.65);
    epiBox.strokeRoundedRect(w / 2 - epiW / 2, epiY - epiH / 2, epiW, epiH, 8);

    const endingTitleStr = this.finalEnding && this.finalEnding.ending ? `ИТОГ ПОХОДА: ${this.finalEnding.ending}` : 'ИТОГ ПОХОДА: ВЕЛИКИЙ ТРИУМФ В СЕМЕЕ';
    const endingTitle = this.add.text(w / 2, epiY - epiH / 2 + 16, endingTitleStr, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '13px',
      color: '#FFE8C0',
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0);

    const epiText = this.add.text(w / 2, epiY + 12, this.epilogueText, {
      fontFamily: 'Lora, Georgia, serif',
      fontSize: '12px',
      color: '#D4C5A9',
      align: 'center',
      wordWrap: { width: epiW - 40 },
      lineSpacing: 3,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: [epiBox, endingTitle, epiText], alpha: 1, duration: 700, delay });
    delay += 450;

    // Divider
    const div = this.add.graphics().setAlpha(0);
    div.lineStyle(1, 0xC4A46C, 0.3);
    div.lineBetween(w * 0.18, 362, w * 0.82, 362);
    this.tweens.add({ targets: div, alpha: 1, duration: 400, delay });
    delay += 250;

    // Heritage points display & Rank Badge
    const pointsLabel = this.add.text(w / 2, 388, 'НАБРАННЫЕ ОЧКИ НАСЛЕДИЯ  •  HERITAGE POINTS', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      color: '#A0896C',
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0);

    const pointsValue = this.add.text(w / 2, 424, `${this.finalPoints} PTS`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '34px',
      color: '#FFD700',
      stroke: '#2A1506',
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0).setScale(0.85);

    const rankColor = this.getRankColor();
    const badgeW = 340;
    const badgeH = 34;
    const badgeY = 470;

    const rankBadge = this.add.graphics().setAlpha(0);
    rankBadge.fillStyle(0x150800, 0.85);
    rankBadge.fillRoundedRect(w / 2 - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 17);
    rankBadge.lineStyle(1.5, rankColor, 0.85);
    rankBadge.strokeRoundedRect(w / 2 - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 17);

    const rankText = this.add.text(w / 2, badgeY, `✦  РАНГ: ${this.finalRank}  ✦`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '14px',
      color: rankColor,
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0);

    const trustText = this.add.text(w / 2, 502, `УРОВЕНЬ ДОВЕРИЯ ЖИТЕЛЕЙ: ${this.trust}%  •  ВСЕ ГЛАВЫ ЗАВЕРШЕНЫ`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '10.5px',
      color: '#C4A46C',
      letterSpacing: 1.5,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: pointsLabel, alpha: 1, duration: 400, delay });
    this.tweens.add({ targets: pointsValue, alpha: 1, scaleX: 1, scaleY: 1, duration: 550, delay: delay + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [rankBadge, rankText, trustText], alpha: 1, duration: 500, delay: delay + 250 });
    delay += 550;

    // Action Buttons
    this.createButtons(w, h, delay);

    // Immortal quote from Abai
    const quoteTxt = this.add.text(w / 2, 692, '«Өлді деуге бола ма, ойлаңдаршы, Өлмейтұғын артына сөз қалдырған...»', {
      fontFamily: 'Lora, Georgia, serif',
      fontSize: '12.5px',
      color: '#C4A46C',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    const authorTxt = this.add.text(w / 2, 714, '— Хәкім Абай Құнанбайұлы (1845–1904)', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      color: '#8B7355',
      letterSpacing: 1,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: [quoteTxt, authorTxt], alpha: 0.9, duration: 600, delay: delay + 350 });
  }

  createButtons(w, h, delay) {
    const btnW = 320;
    const btnH = 42;
    const btnY1 = 554;
    const btnY2 = 614;

    // Button 1: Historical Context
    this.createCustomButton(w / 2, btnY1, btnW, btnH, '📜  ИСТОРИЧЕСКИЕ ХРОНИКИ', delay, () => {
      this.showHistoryModal(w, h);
    });

    // Button 2: Play Again
    this.createCustomButton(w / 2, btnY2, btnW, btnH, '↺  ИГРАТЬ СНОВА (PLAY AGAIN)', delay + 180, () => {
      try {
        localStorage.removeItem('archives_of_alash_save');
      } catch (e) {}
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  createCustomButton(x, y, btnW, btnH, label, delay, onClick) {
    const bg = this.add.graphics().setAlpha(0);
    const drawBtnBg = (hovered = false) => {
      bg.clear();
      bg.fillStyle(hovered ? 0x5C3A1E : 0x361F0F, 0.95);
      bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 8);
      bg.lineStyle(1.5, hovered ? 0xFFD700 : 0x8B7355, 0.85);
      bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 8);
    };
    drawBtnBg(false);

    const text = this.add.text(x, y, label, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '13.5px',
      color: '#E8D5B0',
      letterSpacing: 1.5,
    }).setOrigin(0.5).setAlpha(0);

    const hitArea = this.add.rectangle(x, y, btnW, btnH, 0x000000, 0.01)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: [bg, text], alpha: 1, duration: 550, delay });

    hitArea.on('pointerover', () => {
      drawBtnBg(true);
      text.setColor('#FFE8C0');
    });

    hitArea.on('pointerout', () => {
      drawBtnBg(false);
      text.setColor('#E8D5B0');
    });

    hitArea.on('pointerdown', () => {
      soundManager.playPaperRustle();
      onClick();
    });
  }

  showHistoryModal(w, h) {
    const modalContainer = this.add.container(0, 0).setDepth(150);

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.88).setInteractive();
    modalContainer.add(overlay);

    const panelW = 700;
    const panelH = 530;
    const px = w / 2;
    const py = h / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x231206, 0.98);
    panel.fillRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    panel.lineStyle(2, 0xD4AF37, 0.85);
    panel.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    modalContainer.add(panel);

    const title = this.add.text(px, py - panelH / 2 + 35, '◆  ИСТОРИЧЕСКИЕ ХРОНИКИ (1904–1937)  ◆', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '17px',
      color: '#FFD700',
      letterSpacing: 2,
    }).setOrigin(0.5);
    modalContainer.add(title);

    let cy = py - panelH / 2 + 75;
    HISTORY_CARDS.forEach((card) => {
      const cardTitle = this.add.text(px - panelW / 2 + 35, cy, card.title, {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        color: '#FFE8C0',
        letterSpacing: 1,
      });
      modalContainer.add(cardTitle);

      const cardBody = this.add.text(px - panelW / 2 + 35, cy + 20, card.text, {
        fontFamily: 'Lora, Georgia, serif',
        fontSize: '12px',
        color: '#D4C5A9',
        wordWrap: { width: panelW - 70 },
        lineSpacing: 3,
      });
      modalContainer.add(cardBody);

      cy += 95;
    });

    const closeBtn = this.add.text(px, py + panelH / 2 - 30, '[ ЗАКРЫТЬ АРХИВ / CLOSE ]', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '14px',
      color: '#C4A46C',
      letterSpacing: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    modalContainer.add(closeBtn);

    closeBtn.on('pointerover', () => closeBtn.setColor('#FFE8C0'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#C4A46C'));
    closeBtn.on('pointerdown', () => modalContainer.destroy());
    overlay.on('pointerdown', () => modalContainer.destroy());
  }

  getRankColor() {
    if (this.finalRank === 'HERITAGE KEEPER') return '#FFD700';
    if (this.finalRank === 'ARCHIVE SCHOLAR') return '#C4A46C';
    return '#A0896C';
  }

  createBackground(w, h) {
    const g = this.add.graphics();
    g.fillStyle(0x120704);
    g.fillRect(0, 0, w, h);

    // Warm radial lights
    for (let i = 0; i < 5; i++) {
      g.fillStyle(0xD4AF37, 0.035 - i * 0.006);
      g.fillCircle(w / 2, 220, 160 + i * 70);
    }
  }

  createOrnamentalFrame(w, h) {
    const g = this.add.graphics();
    const m = 20;
    g.lineStyle(1.5, 0xC4A46C, 0.25);
    g.strokeRect(m, m, w - m * 2, h - m * 2);
    g.lineStyle(1, 0x8B7355, 0.15);
    g.strokeRect(m + 6, m + 6, w - (m + 6) * 2, h - (m + 6) * 2);

    // Corner Kazakh flourish brackets
    const cs = 18;
    g.lineStyle(2, 0xD4AF37, 0.6);
    // Top-left
    g.lineBetween(m + 2, m + 2, m + 2 + cs, m + 2);
    g.lineBetween(m + 2, m + 2, m + 2, m + 2 + cs);
    // Top-right
    g.lineBetween(w - m - 2, m + 2, w - m - 2 - cs, m + 2);
    g.lineBetween(w - m - 2, m + 2, w - m - 2, m + 2 + cs);
    // Bottom-left
    g.lineBetween(m + 2, h - m - 2, m + 2 + cs, h - m - 2);
    g.lineBetween(m + 2, h - m - 2, m + 2, h - m - 2 - cs);
    // Bottom-right
    g.lineBetween(w - m - 2, h - m - 2, w - m - 2 - cs, h - m - 2);
    g.lineBetween(w - m - 2, h - m - 2, w - m - 2, h - m - 2 - cs);
  }

  createAmbientParticles(w, h) {
    this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: w },
      y: { min: 0, max: h },
      lifespan: { min: 4000, max: 8000 },
      speed: { min: 4, max: 15 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.22, end: 0 },
      frequency: 280,
      quantity: 1,
      tint: 0xFFD700,
    }).setDepth(0);
  }
}