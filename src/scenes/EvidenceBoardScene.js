import Phaser from 'phaser';
import { soundManager } from '../systems/SoundManager.js';

export default class EvidenceBoardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EvidenceBoardScene' });
  }

  init(data) {
    this.gameScene = data.gameScene;
    this.cm = data.gameScene.chapterManager;
    this.selectedForDeduction = [];
    this.cardVisuals = new Map();
    this.activeTab = 'evidence'; // 'evidence' | 'witnesses'
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x120808, 0.97);

    // Title
    this.add.text(w / 2, 28, '◆  CASE FILE  ◆', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '24px',
      color: '#C4A46C',
      letterSpacing: 4,
    }).setOrigin(0.5);

    this.add.text(w / 2, 54, 'THE MISSING MANUSCRIPT & THE 12 SCRIBES', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '15px',
      color: '#E8D5B0',
      letterSpacing: 2,
    }).setOrigin(0.5);

    soundManager.playPaperRustle();

    // Tab buttons container
    this.createTabButtons(w, h);

    // Containers for the two views
    this.evidenceContainer = this.add.container(0, 0);
    this.witnessContainer = this.add.container(0, 0);
    this.witnessContainer.setVisible(false);

    // Evidence cards & deductions in evidenceContainer
    this.renderEvidenceCards(w, h);
    this.renderDeductions(w, h);

    // Witness testimonies in witnessContainer
    this.renderWitnessTestimonies(w, h);

    // Status text
    this.deductionStatusText = this.add.text(w / 2, h - 75, '', {
      fontFamily: 'Lora, Georgia, serif',
      fontSize: '13px',
      color: '#E8D5B0',
    }).setOrigin(0.5);
    this.evidenceContainer.add(this.deductionStatusText);

    // Connect button
    this.createConnectButton(w, h);

    // Close instruction
    this.add.text(w / 2, h - 20, 'Press TAB or ESC to close | [1] Evidence  [2] Witnesses | [ENTER] Connect', {
      fontFamily: 'Lora, Georgia, serif',
      fontSize: '11px',
      color: '#6B5335',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // Keyboard bindings
    this.input.keyboard.on('keydown-TAB', () => this.closeBoard());
    this.input.keyboard.on('keydown-ESC', () => this.closeBoard());
    this.input.keyboard.on('keydown-ONE', () => this.switchTab('evidence'));
    this.input.keyboard.on('keydown-TWO', () => this.switchTab('witnesses'));
    this.input.keyboard.on('keydown-ENTER', () => this.performDeduction());
    this.input.keyboard.on('keydown-C', () => this.performDeduction());
  }

  createTabButtons(w, h) {
    const tabY = 70;
    const btnW = 200, btnH = 26;

    this.tabEvBtn = this.add.graphics();
    this.tabEvTxt = this.add.text(w / 2 - 110, tabY, '1. EVIDENCE & CLUES', {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '11px', color: '#FFE8C0', letterSpacing: 1,
    }).setOrigin(0.5);

    this.tabWitBtn = this.add.graphics();
    this.tabWitTxt = this.add.text(w / 2 + 110, tabY, '2. WITNESS STATEMENTS', {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '11px', color: '#A0896C', letterSpacing: 1,
    }).setOrigin(0.5);

    const hitEv = this.add.rectangle(w / 2 - 110, tabY, btnW, btnH, 0x000000, 0.01).setInteractive({ useHandCursor: true });
    const hitWit = this.add.rectangle(w / 2 + 110, tabY, btnW, btnH, 0x000000, 0.01).setInteractive({ useHandCursor: true });

    hitEv.on('pointerdown', () => this.switchTab('evidence'));
    hitWit.on('pointerdown', () => this.switchTab('witnesses'));

    this.updateTabVisuals(w);
  }

  updateTabVisuals(w) {
    const tabY = 70;
    const btnW = 200, btnH = 26;
    const isEv = this.activeTab === 'evidence';

    this.tabEvBtn.clear();
    this.tabEvBtn.fillStyle(isEv ? 0x5C3A1E : 0x2A1506, 0.95);
    this.tabEvBtn.fillRoundedRect(w / 2 - 110 - btnW / 2, tabY - btnH / 2, btnW, btnH, 6);
    this.tabEvBtn.lineStyle(1.5, isEv ? 0xC4A46C : 0x8B7355, 0.8);
    this.tabEvBtn.strokeRoundedRect(w / 2 - 110 - btnW / 2, tabY - btnH / 2, btnW, btnH, 6);
    this.tabEvTxt.setColor(isEv ? '#FFE8C0' : '#A0896C');

    this.tabWitBtn.clear();
    this.tabWitBtn.fillStyle(!isEv ? 0x5C3A1E : 0x2A1506, 0.95);
    this.tabWitBtn.fillRoundedRect(w / 2 + 110 - btnW / 2, tabY - btnH / 2, btnW, btnH, 6);
    this.tabWitBtn.lineStyle(1.5, !isEv ? 0xC4A46C : 0x8B7355, 0.8);
    this.tabWitBtn.strokeRoundedRect(w / 2 + 110 - btnW / 2, tabY - btnH / 2, btnW, btnH, 6);
    this.tabWitTxt.setColor(!isEv ? '#FFE8C0' : '#A0896C');
  }

  switchTab(tab) {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    soundManager.playPaperRustle();
    const w = this.cameras.main.width;
    this.updateTabVisuals(w);

    if (tab === 'evidence') {
      this.evidenceContainer.setVisible(true);
      this.witnessContainer.setVisible(false);
      if (this.connectBtnContainer) this.connectBtnContainer.setVisible(true);
    } else {
      this.evidenceContainer.setVisible(false);
      this.witnessContainer.setVisible(true);
      if (this.connectBtnContainer) this.connectBtnContainer.setVisible(false);
    }
  }

  renderEvidenceCards(w, h) {
    const evidence = this.cm.getEvidence();
    const found = evidence.filter(e => e.found);
    const cols = 4;
    const cardW = 210;
    const cardH = 88;
    const startX = 45;
    const startY = 85;
    const gapX = 12;
    const gapY = 12;

    if (found.length === 0) {
      this.add.text(w / 2, startY + 60, 'No evidence discovered yet.\nExplore the village and question the people.', {
        fontFamily: 'Lora, Georgia, serif',
        fontSize: '14px',
        color: '#A0896C',
        align: 'center',
        fontStyle: 'italic',
      }).setOrigin(0.5);
      return;
    }

    this.add.text(45, startY - 8, `EVIDENCE FOUND (${found.length})`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      color: '#8B7355',
      letterSpacing: 2,
    });

    found.forEach((e, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cardW + gapX) + cardW / 2;
      const cy = startY + row * (cardH + gapY) + cardH / 2;

      const bg = this.add.graphics();
      this.drawCardBg(bg, cx, cy, cardW, cardH, false, false);

      const icon = this.add.text(cx - cardW / 2 + 12, cy - cardH / 2 + 10, e.icon || '◆', {
        fontFamily: 'serif',
        fontSize: '13px',
        color: '#C4A46C',
      });

      const name = this.add.text(cx - cardW / 2 + 28, cy - cardH / 2 + 10, e.name, {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '10px',
        color: '#E8D5B0',
        letterSpacing: 1,
        wordWrap: { width: cardW - 42 },
      });

      const desc = this.add.text(cx - cardW / 2 + 10, cy - cardH / 2 + 30, e.description, {
        fontFamily: 'Lora, Georgia, serif',
        fontSize: '9.5px',
        color: '#A0896C',
        wordWrap: { width: cardW - 20 },
        lineSpacing: 2,
      });

      const hitArea = this.add.rectangle(cx, cy, cardW, cardH, 0x000000, 0.01)
        .setInteractive({ useHandCursor: true });

      const cardData = { e, cx, cy, cardW, cardH, bg, hitArea };
      this.cardVisuals.set(e.id, cardData);

      this.evidenceContainer.add([bg, icon, name, desc, hitArea]);

      hitArea.on('pointerdown', () => {
        this.toggleEvidenceSelection(e.id);
      });

      hitArea.on('pointerover', () => {
        const isSelected = this.selectedForDeduction.includes(e.id);
        this.drawCardBg(bg, cx, cy, cardW, cardH, isSelected, true);
      });

      hitArea.on('pointerout', () => {
        const isSelected = this.selectedForDeduction.includes(e.id);
        this.drawCardBg(bg, cx, cy, cardW, cardH, isSelected, false);
      });
    });
  }

  renderWitnessTestimonies(w, h) {
    const startY = 105;
    const witnesses = [
      {
        name: 'Village Elder (Aksakal)',
        role: 'Keeper of the Youth Pact',
        trust: this.cm.getTrust('elder'),
        testimony: 'Entrusted by Sabit with the secret roster of 12 copyists. Hid it in an oiled packet under the well foundation stone to shield them from imperial arrest.'
      },
      {
        name: 'Teacher (Mugalim)',
        role: 'Village Schoolmaster',
        trust: this.cm.getTrust('teacher'),
        testimony: 'Identified rare violet scribe ink made by Murseyit. Recalled an elder holding a package near the well at dawn. Knowledge and verse are our weapons.'
      },
      {
        name: 'Archivist (Muragatshy)',
        role: 'Keeper of Books & Lineages',
        trust: this.cm.getTrust('archivist'),
        testimony: 'Terrified of police confiscations. Moved the page from the well into his travel chest to flee to Semey and deliver it directly to the Alash committee.'
      },
      {
        name: 'Raiymbek (Blacksmith)',
        role: 'Blacksmith & Batyr’s Descendant',
        trust: 85,
        testimony: 'A fierce blacksmith proud of his ancestors. Vows that his forged battle-saber will defend the Master’s words against any road ambush.'
      },
      {
        name: 'Daulet-bai (Merchant)',
        role: 'First-Guild Trade Merchant',
        trust: 80,
        testimony: 'Influential merchant with trade carriages and governor permits. Believes gold and connections can bypass any imperial checkpoint without violence.'
      },
      {
        name: 'Sadyk (Guide)',
        role: 'Steppe Herdsman',
        trust: 30,
        testimony: 'Claims to know secret steppe passes, but eyes valuables hungrily. Beware of false guides in the hills.'
      },
      {
        name: 'Mukhamet (Scribe)',
        role: 'Village Scribe & Clerk',
        trust: 35,
        testimony: 'Speaks official Russian and praises decrees. Highly interested in the imperial bounty for unregistered texts.'
      }
    ];

    const cardW = 440;
    const cardH = 92;
    const gapX = 24;
    const gapY = 12;
    const cols = 2;

    witnesses.forEach((wit, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx = 55 + col * (cardW + gapX) + cardW / 2;
      const cy = startY + row * (cardH + gapY) + cardH / 2;

      const bg = this.add.graphics();
      bg.fillStyle(0x2A1506, 0.95);
      bg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 8);
      bg.lineStyle(1.5, 0x8B7355, 0.7);
      bg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 8);
      this.witnessContainer.add(bg);

      const title = this.add.text(cx - cardW / 2 + 14, cy - cardH / 2 + 10, wit.name, {
        fontFamily: 'Cinzel, Georgia, serif', fontSize: '13px', color: '#FFE8C0', letterSpacing: 1,
      });
      this.witnessContainer.add(title);

      const role = this.add.text(cx - cardW / 2 + 14, cy - cardH / 2 + 28, `${wit.role}  |  Trust: ${wit.trust}%`, {
        fontFamily: 'Lora, Georgia, serif', fontSize: '10px', color: '#C4A46C', fontStyle: 'italic',
      });
      this.witnessContainer.add(role);

      const body = this.add.text(cx - cardW / 2 + 14, cy - cardH / 2 + 45, wit.testimony, {
        fontFamily: 'Lora, Georgia, serif', fontSize: '10.5px', color: '#D4C5A9',
        wordWrap: { width: cardW - 28 }, lineSpacing: 2,
      });
      this.witnessContainer.add(body);
    });
  }

  drawCardBg(graphics, cx, cy, w, h, isSelected, isHover) {
    graphics.clear();
    let fillColor = 0x2A1506;
    let strokeColor = 0x8B7355;
    let strokeWidth = 1.5;

    if (isSelected) {
      fillColor = isHover ? 0x6A4E2A : 0x543E1F;
      strokeColor = 0xC4A46C;
      strokeWidth = 2.5;
    } else if (isHover) {
      fillColor = 0x3D2B1A;
      strokeColor = 0xC4A46C;
    }

    graphics.fillStyle(fillColor, 0.95);
    graphics.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    graphics.lineStyle(strokeWidth, strokeColor, 0.9);
    graphics.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
  }

  toggleEvidenceSelection(evidenceId) {
    const idx = this.selectedForDeduction.indexOf(evidenceId);
    if (idx >= 0) {
      this.selectedForDeduction.splice(idx, 1);
    } else {
      if (this.selectedForDeduction.length >= 2) {
        this.selectedForDeduction.shift();
      }
      this.selectedForDeduction.push(evidenceId);
    }

    this.cardVisuals.forEach((card, id) => {
      const isSelected = this.selectedForDeduction.includes(id);
      this.drawCardBg(card.bg, card.cx, card.cy, card.cardW, card.cardH, isSelected, false);
    });

    if (this.selectedForDeduction.length === 2) {
      this.deductionStatusText.setText('Ready to connect! Click [CONNECT CLUES] below.');
      this.deductionStatusText.setColor('#FFE8C0');
    } else if (this.selectedForDeduction.length === 1) {
      this.deductionStatusText.setText('Select a second clue to link.');
      this.deductionStatusText.setColor('#A0896C');
    } else {
      this.deductionStatusText.setText('');
    }
  }

  renderDeductions(w, h) {
    if (this.deductionsContainer) {
      this.deductionsContainer.destroy();
    }

    this.deductionsContainer = this.add.container(0, 0);
    this.evidenceContainer.add(this.deductionsContainer);
    const deductions = this.cm.getDeductions();
    if (deductions.length === 0) return;

    const startY = 320;
    const title = this.add.text(45, startY, `DEDUCTIONS & REVELATIONS (${deductions.length})`, {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '11px',
      color: '#8B7355',
      letterSpacing: 2,
    });
    this.deductionsContainer.add(title);

    deductions.forEach((d, i) => {
      const dy = startY + 22 + i * 22;
      const text = this.add.text(48, dy, `◆ ${d.result}`, {
        fontFamily: 'Lora, Georgia, serif',
        fontSize: '12px',
        color: '#E8D5B0',
        fontStyle: 'italic',
      });
      this.deductionsContainer.add(text);
    });
  }

  createConnectButton(w, h) {
    const btnW = 220;
    const btnH = 38;
    const btnX = w / 2;
    const btnY = h - 48;

    const bg = this.add.graphics();
    bg.fillStyle(0x3D2B1A, 0.95);
    bg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    bg.lineStyle(1.5, 0xC4A46C, 0.8);
    bg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

    const label = this.add.text(btnX, btnY, 'CONNECT CLUES', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '13px',
      color: '#E8D5B0',
      letterSpacing: 2,
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(btnX, btnY, btnW, btnH, 0x000000, 0.01)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x5C3A1E, 0.95);
      bg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      bg.lineStyle(2, 0xC4A46C, 1);
      bg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      label.setColor('#FFE8C0');
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x3D2B1A, 0.95);
      bg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      bg.lineStyle(1.5, 0xC4A46C, 0.8);
      bg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      label.setColor('#E8D5B0');
    });

    hitArea.on('pointerdown', () => {
      this.performDeduction();
    });
  }

  performDeduction() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    if (this.selectedForDeduction.length !== 2) {
      this.deductionStatusText.setText('Select exactly two evidence cards to connect.');
      this.deductionStatusText.setColor('#C4743A');
      return;
    }

    const result = this.cm.tryDeduction(
      this.selectedForDeduction[0],
      this.selectedForDeduction[1]
    );

    if (result.success) {
      if (result.new) {
        soundManager.playDeductionSuccess();
        this.deductionStatusText.setText('◆ NEW DEDUCTION: ' + result.result);
        this.deductionStatusText.setColor('#70C050');
      } else {
        this.deductionStatusText.setText('Already deduced: ' + result.result);
        this.deductionStatusText.setColor('#A0896C');
      }

      this.selectedForDeduction = [];
      this.cardVisuals.forEach((card, id) => {
        this.drawCardBg(card.bg, card.cx, card.cy, card.cardW, card.cardH, false, false);
      });
      this.renderDeductions(w, h);

      if (this.gameScene) {
        this.gameScene.updateAllUI();
      }

      // Check if Chapter 3 goal is reached (deducing the 12 copyists)
      const hasCopyistDeduction = this.cm.getDeductions().some(d =>
        d.result.toLowerCase().includes('copyist') || d.result.toLowerCase().includes('scribe')
      );

      if (this.cm.isChapterActive('ch3') && this.cm.getEvidenceCount() >= 4 && hasCopyistDeduction) {
        this.time.delayedCall(1500, () => {
          this.cm.completeChapter('ch3');
          this.closeBoard();
          this.gameScene.showQuestCompleteEffect(
            'CHAPTER 3 COMPLETE',
            'The secret is revealed: the page holds 12 names!\nSpeak with the Elder to discover where it was hidden.',
            '+15 Heritage Points'
          );
          this.gameScene.updateAllUI();
        });
      }
    } else {
      this.deductionStatusText.setText('These clues do not seem connected.');
      this.deductionStatusText.setColor('#C4743A');
    }
  }

  closeBoard() {
    this.scene.stop();
    if (this.gameScene) {
      this.gameScene.scene.resume();
      this.gameScene.updateAllUI();
    }
  }
}