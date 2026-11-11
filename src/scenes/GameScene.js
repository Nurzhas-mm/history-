import Phaser from 'phaser';
import Player from '../entities/Player.js';
import NPC from '../entities/NPC.js';
import ChapterManager from '../systems/ChapterManager.js';
import soundManager from '../systems/SoundManager.js';
import { MAP_WIDTH, MAP_HEIGHT, PLAYER_START, BUILDINGS, TREES, NPCS, FRAGMENTS, DECORATIONS } from '../data/mapData.js';
import { DIALOGUE, INTERVIEW_CHOICES } from '../data/dialogue.js';
import { EVIDENCE } from '../data/evidence.js';
import { COMPANIONS, FINAL_CHOICES, EPILOGUES } from '../data/chapters.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Audio initialization — wind plays only while inside the event
    soundManager.init();
    soundManager.startWindAmbient();
    const startWindIfActive = () => {
      if (this.scene && this.scene.isActive('GameScene')) {
        soundManager.startWindAmbient();
      }
    };
    this.input.once('pointerdown', startWindIfActive);
    this.input.keyboard.once('keydown', startWindIfActive);
    this.events.once('shutdown', () => {
      this.input.off('pointerdown', startWindIfActive);
      this.input.keyboard.off('keydown', startWindIfActive);
      soundManager.stopWindAmbient();
    });

    this.dialogueActive = false;
    this.dialogueQueue = [];
    this.dialogueIndex = 0;
    this.isTyping = false;
    this.showingChoices = false;
    this.showingEvidenceMenu = false;
    this.evidenceMenuContainer = null;
    this.currentDialogueNpcKey = null;
    this.interactionTarget = null;
    this.allQuestsDone = false;
    this.eveningApplied = false;

    // Road journey & companion states
    this.followerCompanion = null;
    this.followerShadow = null;
    this.ambushTriggered = false;
    this.ambushResolved = false;
    this.checkpointTriggered = false;
    this.alashArrivalTriggered = false;
    this.footstepTimer = 0;

    this.chapterManager = new ChapterManager();
    // Try loading previous save if available
    this.chapterManager.loadState();

    if (!this.chapterManager.isChapterActive('ch6')) {
      this.chapterManager.companion = null;
      this.chapterManager.checkpointPassed = false;
    }

    this.drawMap();
    this.createShadowLayer();
    this.createDecorations();
    this.createTrees();
    this.createBuildings();
    this.createFragments();
    this.createEvidenceObjects();
    this.createPlayer();
    this.createNPCs();
    this.createUI();
    this.setupInput();
    this.createAmbientParticles();

    if (this.chapterManager.isChapterActive('ch6') && this.chapterManager.companion) {
      this.createFollowerCompanion(this.chapterManager.companion);
    } else {
      this.chapterManager.companion = null;
      if (this.followerCompanion) {
        this.followerCompanion.destroy();
        this.followerCompanion = null;
      }
      if (this.followerShadow) {
        this.followerShadow.destroy();
        this.followerShadow = null;
      }
      this.syncCompanionNpcVisibility();
    }

    if (this.chapterManager.isEvening) {
      this.applyEveningTransition(true);
    }

    // Auto-advance checks on load if criteria were fulfilled in saved state
    if (this.chapterManager.isChapterActive('ch2') && this.chapterManager.getInterviewedCount() >= 3) {
      this.chapterManager.completeChapter('ch2');
      this.createEvidenceObjects();
    }
    const hasCopyistDeduction = this.chapterManager.getDeductions().some(d =>
      d.result.toLowerCase().includes('copyist') || d.result.toLowerCase().includes('scribe')
    );
    if (this.chapterManager.isChapterActive('ch3') && this.chapterManager.getEvidenceCount() >= 4 && hasCopyistDeduction) {
      this.chapterManager.completeChapter('ch3');
      this.createEvidenceObjects();
    }

    this.updateAllUI();
  }

  update() {
    if (this.dialogueActive || this.allQuestsDone || this.showingChoices || this.showingEvidenceMenu) {
      if (this.player) this.player.setVelocity(0, 0);
      return;
    }

    this.player.update(this.cursors, this.wasd);

    // Procedural footstep audio
    if (this.player && this.player.body) {
      const vx = this.player.body.velocity.x;
      const vy = this.player.body.velocity.y;
      if (vx !== 0 || vy !== 0) {
        this.footstepTimer = (this.footstepTimer || 0) + 1;
        if (this.footstepTimer % 20 === 0) {
          soundManager.playFootstep();
        }
      }
    }

    // Follower companion smooth tracking
    if (this.followerCompanion) {
      const vx = this.player.body ? this.player.body.velocity.x : 0;
      const vy = this.player.body ? this.player.body.velocity.y : 0;
      const offsetX = vx > 0 ? -36 : (vx < 0 ? 36 : -28);
      const offsetY = vy > 0 ? -32 : (vy < 0 ? 32 : 4);
      const targetX = this.player.x + offsetX;
      const targetY = this.player.y + offsetY;
      const dist = Phaser.Math.Distance.Between(this.followerCompanion.x, this.followerCompanion.y, targetX, targetY);
      if (dist > 18) {
        this.followerCompanion.x = Phaser.Math.Linear(this.followerCompanion.x, targetX, 0.12);
        this.followerCompanion.y = Phaser.Math.Linear(this.followerCompanion.y, targetY, 0.12);
      }
      if (this.followerShadow) {
        this.followerShadow.setPosition(this.followerCompanion.x, this.followerCompanion.y + 16);
      }
    }

    if (this.npcs) {
      this.npcs.forEach(npc => npc.updateShadowPosition());
    }
    this.checkInteractions();

    // Village eastern boundary check: x >= 2480
    if (this.player.x >= 2480) {
      const cm = this.chapterManager;
      if (!cm.isChapterActive('ch6') && !cm.isChapterCompleted('ch6')) {
        this.player.x = 2455;
        this.showFloatingNotice('⚠ The eastern road leads to Semey. Finish your investigation in the village first.');
      } else if (cm.isChapterActive('ch6') && !cm.companion) {
        this.player.x = 2455;
        this.showFloatingNotice('⚠ The Steppe Road is dangerous! Recruit a companion in the village before departing.');
      }
    }

    // Steppe Road ambush check: x >= 2760
    if (this.chapterManager.isChapterActive('ch6') && this.chapterManager.companion && !this.ambushTriggered && !this.ambushResolved) {
      if (this.player.x >= 2760 && this.player.x <= 2920) {
        this.ambushTriggered = true;
        this.triggerRoadAmbush();
      }
    }

    // Frontier Post sentry check: x >= 3130
    if (this.chapterManager.isChapterActive('ch6') && this.ambushResolved && !this.chapterManager.isCheckpointPassed()) {
      if (this.player.x >= 3130 && this.player.x <= 3220 && !this.checkpointTriggered) {
        this.checkpointTriggered = true;
        this.triggerCheckpointEncounter();
      }
    }

    // Semey Alash Headquarters arrival check: x >= 3790
    if (this.chapterManager.isChapterActive('ch6') && this.chapterManager.isCheckpointPassed() && !this.alashArrivalTriggered) {
      if (this.player.x >= 3790) {
        this.alashArrivalTriggered = true;
        this.triggerAlashArrival();
      }
    }
  }

  showFloatingNotice(text) {
    if (this.floatingNoticeActive) return;
    this.floatingNoticeActive = true;
    const w = this.cameras.main.width;
    const notice = this.add.text(w / 2, 85, text, {
      fontFamily: 'Lora, Georgia, serif',
      fontSize: '13px',
      color: '#FFE8C0',
      backgroundColor: '#1a0a00ee',
      padding: { x: 14, y: 7 },
      stroke: '#2A1506',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(120).setScrollFactor(0);

    this.tweens.add({
      targets: notice,
      y: 65,
      alpha: 0,
      duration: 2500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        notice.destroy();
        this.floatingNoticeActive = false;
      }
    });
  }

  createFollowerCompanion(id) {
    if (this.followerCompanion) {
      this.followerCompanion.destroy();
      this.followerCompanion = null;
    }
    if (this.followerShadow) {
      this.followerShadow.destroy();
      this.followerShadow = null;
    }
    const texture = `npc_${id}`;
    this.followerCompanion = this.add.image(this.player.x - 32, this.player.y, texture).setDepth(9);
    this.followerShadow = this.add.image(this.player.x - 32, this.player.y + 16, 'shadow')
      .setDepth(8).setAlpha(0.25).setScale(0.85);
    this.syncCompanionNpcVisibility();
  }

  syncCompanionNpcVisibility() {
    const activeCompanionId = (this.chapterManager && this.chapterManager.isChapterActive('ch6'))
      ? this.chapterManager.companion
      : null;
    if (!this.npcs) return;
    this.npcs.forEach(npc => {
      if (['sadyk', 'mukhamet', 'raiymbek', 'dauletbai'].includes(npc.npcId)) {
        if (typeof npc.setNpcVisible === 'function') {
          npc.setNpcVisible(npc.npcId !== activeCompanionId);
        } else {
          npc.setVisible(npc.npcId !== activeCompanionId);
        }
      }
    });
  }

  // ==================== MAP ====================
  drawMap() {
    const g = this.add.graphics().setDepth(0);
    // Grass steppe base
    g.fillStyle(0x5A7D3A);
    g.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Steppe grass specks
    for (let i = 0; i < 950; i++) {
      const gx = Phaser.Math.Between(0, MAP_WIDTH);
      const gy = Phaser.Math.Between(0, MAP_HEIGHT);
      const shade = Phaser.Math.Between(0, 2);
      const colors = [0x557838, 0x648840, 0x4E7030];
      g.fillStyle(colors[shade], Phaser.Math.FloatBetween(0.6, 0.9));
      g.fillCircle(gx, gy, Phaser.Math.Between(2, 6));
    }

    // Grass blades
    for (let i = 0; i < 420; i++) {
      const gx = Phaser.Math.Between(0, MAP_WIDTH);
      const gy = Phaser.Math.Between(0, MAP_HEIGHT);
      g.lineStyle(1, 0x4E7030, 0.3);
      g.lineBetween(gx, gy, gx + 2, gy - 4);
      g.lineBetween(gx, gy, gx - 2, gy - 3);
    }

    // ==================== SPACIOUS VILLAGE ROADS & CENTRAL SQUARE (x: 240..2450) ====================
    g.fillStyle(0x8B7355, 0.48);
    // Main horizontal avenues across the village
    g.fillRect(300, 340, 1840, 95);   // Northern avenue (Elder -> House 1 -> Daulet-bai Manor -> Archive)
    g.fillRect(300, 810, 2150, 110);  // Central thoroughfare (West Village -> Central Square -> Steppe Road)
    g.fillRect(300, 1280, 1840, 95);  // Southern avenue (Teacher -> Sadyk -> Mukhamet -> Raiymbek Forge)

    // Vertical connecting lanes across the village
    g.fillRect(310, 340, 85, 1035);   // West lane (Elder <-> House 3 <-> Teacher)
    g.fillRect(760, 275, 85, 1080);   // West-Central lane (House 1 <-> House 6 <-> Sadyk)
    g.fillRect(1450, 335, 90, 1030);  // East-Central lane (Daulet-bai Manor <-> Central Square <-> Mukhamet)
    g.fillRect(2015, 375, 90, 980);   // East Village lane (Archive <-> House 5 <-> Raiymbek Forge)

    // Southernmost spurs to Houses 4 & 2
    g.fillRect(1135, 1340, 80, 130);
    g.fillRect(1775, 1340, 80, 110);

    // Lighter inner road surface
    g.fillStyle(0x9B8B75, 0.35);
    g.fillRect(315, 355, 1810, 65);
    g.fillRect(315, 825, 2135, 80);
    g.fillRect(315, 1295, 1810, 65);
    g.fillRect(325, 355, 55, 1005);
    g.fillRect(775, 290, 55, 1050);
    g.fillRect(1465, 350, 60, 1000);
    g.fillRect(2030, 390, 60, 950);

    // Central Village Square & Communal Well Plaza
    g.fillStyle(0xA09070, 0.45);
    g.fillCircle(1150, 865, 250);
    g.fillStyle(0xB5A486, 0.3);
    g.fillCircle(1150, 865, 175);
    g.lineStyle(1.5, 0x6B5335, 0.35);
    g.strokeCircle(1150, 865, 250);
    g.strokeCircle(1150, 865, 175);

    // Courtyard forecourts for key buildings
    g.fillStyle(0x8B7355, 0.4);
    g.fillRect(1400, 325, 190, 65);  // Daulet-bai's Manor courtyard (north-central)
    g.fillRect(2000, 365, 190, 65);  // Archive courtyard (north-east)
    g.fillRect(1965, 1235, 165, 65); // Raiymbek's Forge courtyard (south-east)

    // ==================== THE GREAT STEPPE ROAD & CANYON (x: 2450..3140) ====================
    // Canyon rocky ridges north and south
    g.fillStyle(0x4A382A, 0.72);
    g.fillRect(2500, 140, 610, 580);
    g.fillRect(2500, 1000, 610, 620);
    g.fillStyle(0x382A1E, 0.85);
    g.fillRect(2540, 180, 530, 490);
    g.fillRect(2540, 1050, 530, 520);

    // Rocky gorge contours
    g.lineStyle(2, 0x5C4634, 0.6);
    g.strokeRect(2500, 140, 610, 580);
    g.strokeRect(2500, 1000, 610, 620);

    // Steppe canyon road surface
    g.fillStyle(0x7D6548, 0.85);
    g.fillRect(2450, 795, 690, 130);
    g.fillStyle(0x947D5E, 0.5);
    g.fillRect(2460, 810, 670, 100);
    g.lineStyle(1.5, 0x664E35, 0.5);
    g.strokeRect(2450, 795, 690, 130);

    // Road ruts and wagon tracks
    g.lineStyle(1, 0x553E27, 0.35);
    g.lineBetween(2460, 838, 3135, 838);
    g.lineBetween(2460, 882, 3135, 882);

    // Steppe canyon rocks
    for (let r = 0; r < 28; r++) {
      const rx = Phaser.Math.Between(2520, 3090);
      const ry = Phaser.Math.Between(730, 785);
      g.fillStyle(0x5A4A38, 0.7);
      g.fillCircle(rx, ry, Phaser.Math.Between(4, 10));
      const rx2 = Phaser.Math.Between(2520, 3090);
      const ry2 = Phaser.Math.Between(935, 990);
      g.fillCircle(rx2, ry2, Phaser.Math.Between(4, 10));
    }

    // ==================== FRONTIER CHECKPOINT OUTPOST (x: 3130..3230) ====================
    g.fillStyle(0x66533D, 0.95);
    g.fillRect(3135, 750, 95, 220);
    g.lineStyle(2, 0x423220, 0.8);
    g.strokeRect(3135, 750, 95, 220);

    // ==================== SEMEY CITY QUARTER (x: 3230..4200) ====================
    // Paved stone district
    g.fillStyle(0x504A44);
    g.fillRect(3230, 180, 940, 1420);

    // Cobblestone pavement grid
    g.lineStyle(1, 0x3E3832, 0.45);
    for (let cx = 3230; cx < 4160; cx += 28) {
      g.lineBetween(cx, 190, cx, 1590);
    }
    for (let cy = 190; cy < 1590; cy += 18) {
      g.lineBetween(3230, cy, 4160, cy);
    }

    // Main city avenue
    g.fillStyle(0x5D554D);
    g.fillRect(3230, 780, 930, 160);
    g.lineStyle(2, 0x7B7166, 0.8);
    g.lineBetween(3230, 780, 4160, 780);
    g.lineBetween(3230, 940, 4160, 940);

    // City plaza in front of Alash Headquarters
    g.lineStyle(2, 0x8C8174, 0.5);
    g.strokeCircle(3875, 790, 75);
    g.strokeCircle(3875, 790, 110);
    g.fillStyle(0x655D54, 0.6);
    g.fillCircle(3875, 790, 48);
  }

  createShadowLayer() {
    const g = this.add.graphics().setDepth(1);
    BUILDINGS.forEach(b => {
      g.fillStyle(0x000000, 0.12);
      g.fillEllipse(b.x + b.w / 2, b.y + b.h + 4, b.w * 1.1, 16);
    });
  }

  createTrees() {
    TREES.forEach(t => {
      const tree = this.add.image(t.x, t.y, 'tree').setDepth(5);
      const scale = Phaser.Math.FloatBetween(0.85, 1.25);
      tree.setScale(scale);
      const shadow = this.add.image(t.x + 2, t.y + 5, 'shadow')
        .setDepth(4).setAlpha(0.3).setScale(scale * 0.7);
      shadow.setTint(0x1a3a08);
    });
  }

  createDecorations() {
    DECORATIONS.forEach(d => {
      const g = this.add.graphics().setDepth(3);
      if (d.type === 'fence_h') {
        g.fillStyle(0x000000, 0.1);
        g.fillRect(d.x + 2, d.y + 4, d.w, 3);
        g.fillStyle(0x4A3520);
        for (let i = 0; i <= d.w; i += 20) g.fillRect(d.x + i, d.y - 2, 4, 16);
        g.fillStyle(0x5C3A1E);
        g.fillRect(d.x, d.y + 2, d.w, 3);
        g.fillRect(d.x, d.y + 9, d.w, 3);
      } else if (d.type === 'fence_v') {
        g.fillStyle(0x000000, 0.1);
        g.fillRect(d.x + 3, d.y + 2, 3, d.h);
        g.fillStyle(0x4A3520);
        for (let i = 0; i <= d.h; i += 20) g.fillRect(d.x - 2, d.y + i, 16, 4);
        g.fillStyle(0x5C3A1E);
        g.fillRect(d.x + 2, d.y, 3, d.h);
        g.fillRect(d.x + 9, d.y, 3, d.h);
      } else if (d.type === 'well') {
        g.fillStyle(0x000000, 0.15);
        g.fillEllipse(d.x, d.y + 16, 38, 12);
        g.fillStyle(0x7A6A55);
        g.fillCircle(d.x, d.y, 18);
        g.lineStyle(2, 0x6B5335);
        g.strokeCircle(d.x, d.y, 18);
        g.fillStyle(0x2A1A08);
        g.fillCircle(d.x, d.y, 12);
        g.fillStyle(0x5C3A1E);
        g.fillRect(d.x - 14, d.y - 2, 28, 4);
        g.fillStyle(0x4A3520);
        g.fillRect(d.x - 12, d.y - 22, 4, 20);
        g.fillRect(d.x + 8, d.y - 22, 4, 20);
        g.fillStyle(0x5C3A1E);
        g.fillTriangle(d.x - 16, d.y - 22, d.x, d.y - 34, d.x + 16, d.y - 22);
      } else if (d.type === 'cart') {
        g.fillStyle(0x000000, 0.12);
        g.fillEllipse(d.x, d.y + 12, 36, 10);
        g.fillStyle(0x7A6345);
        g.fillRoundedRect(d.x - 15, d.y - 8, 30, 14, 3);
        g.fillStyle(0x6B5335);
        g.fillRect(d.x - 12, d.y - 5, 24, 8);
        g.lineStyle(2, 0x4A3520);
        g.strokeCircle(d.x - 10, d.y + 10, 7);
        g.strokeCircle(d.x + 10, d.y + 10, 7);
      } else if (d.type === 'stones') {
        g.fillStyle(0x6E6152);
        g.fillCircle(d.x, d.y, 10);
        g.fillStyle(0x827566);
        g.fillCircle(d.x + 8, d.y + 4, 7);
        g.fillCircle(d.x - 7, d.y + 3, 6);
      } else if (d.type === 'horse_hitch') {
        g.fillStyle(0x4A3520);
        g.fillRect(d.x - 4, d.y - 20, 8, 24);
        g.fillRect(d.x + 24, d.y - 20, 8, 24);
        g.fillStyle(0x5C3A1E);
        g.fillRect(d.x - 8, d.y - 18, 44, 5);
        g.lineStyle(1.5, 0x8B7355);
        g.strokeCircle(d.x + 8, d.y - 14, 4);
        g.strokeCircle(d.x + 20, d.y - 14, 4);
      } else if (d.type === 'anvil') {
        // Tree stump base
        g.fillStyle(0x5C3A1E);
        g.fillEllipse(d.x, d.y + 4, 26, 16);
        g.fillRect(d.x - 12, d.y - 10, 24, 16);
        // Heavy iron anvil
        g.fillStyle(0x2F353B);
        g.fillRect(d.x - 10, d.y - 17, 20, 8);
        g.fillTriangle(d.x - 10, d.y - 17, d.x - 17, d.y - 19, d.x - 10, d.y - 12);
        g.fillStyle(0x5A626A);
        g.fillRect(d.x - 8, d.y - 17, 16, 2);
      } else if (d.type === 'trade_carriage') {
        // Carriage shadow
        g.fillStyle(0x000000, 0.2);
        g.fillEllipse(d.x, d.y + 14, 54, 18);
        // Wooden carriage body
        g.fillStyle(0x6B4B32);
        g.fillRect(d.x - 22, d.y - 12, 44, 22);
        // Canvas curved top
        g.fillStyle(0xDFD6C2);
        g.fillRoundedRect(d.x - 24, d.y - 26, 48, 22, { tl: 12, tr: 12, bl: 0, br: 0 });
        g.lineStyle(1, 0x8B7355, 0.6);
        g.strokeRoundedRect(d.x - 24, d.y - 26, 48, 22, { tl: 12, tr: 12, bl: 0, br: 0 });
        // Spoke wheels
        g.lineStyle(2, 0x3D2817);
        g.strokeCircle(d.x - 14, d.y + 10, 9);
        g.strokeCircle(d.x + 14, d.y + 10, 9);
        g.fillStyle(0xC4A46C);
        g.fillCircle(d.x - 14, d.y + 10, 2.5);
        g.fillCircle(d.x + 14, d.y + 10, 2.5);
      } else if (d.type === 'checkpoint_gate') {
        // Frontier Checkpoint Gate (turnpike beam)
        const gateContainer = this.add.container(d.x, d.y).setDepth(6);
        const post = this.add.graphics();
        post.fillStyle(0x3D2B1A);
        post.fillRect(-6, -32, 12, 34);
        post.fillStyle(0x8B7355);
        post.fillRect(-8, -34, 16, 4);
        gateContainer.add(post);

        const beam = this.add.graphics();
        const beamLen = 90;
        const isPassed = this.chapterManager.isCheckpointPassed();
        beam.angle = isPassed ? -75 : 0;
        for (let bi = 0; bi < beamLen; bi += 15) {
          beam.fillStyle(bi % 30 === 0 ? 0xB22222 : 0xF0E6D2);
          beam.fillRect(bi, -30, 15, 6);
        }
        beam.lineStyle(1, 0x2A1506);
        beam.strokeRect(0, -30, beamLen, 6);
        gateContainer.add(beam);

        this.checkpointBeam = beam;
      } else if (d.type === 'street_lantern') {
        // Ornate Semey street lantern
        const postG = this.add.graphics().setDepth(4);
        postG.fillStyle(0x232B2B);
        postG.fillRect(d.x - 2, d.y - 28, 4, 30);
        postG.fillRect(d.x - 5, d.y + 2, 10, 4);
        postG.fillRect(d.x - 4, d.y - 34, 8, 8);
        postG.fillStyle(0xFFD700, 0.85);
        postG.fillRect(d.x - 2.5, d.y - 32, 5, 5);

        // Ambient glowing light circle
        const light = this.add.circle(d.x, d.y - 12, 55, 0xFFE082, 0.08).setDepth(2);
        this.tweens.add({
          targets: light,
          alpha: { from: 0.06, to: 0.11 },
          scaleX: { from: 0.95, to: 1.08 },
          scaleY: { from: 0.95, to: 1.08 },
          duration: 1800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      } else if (d.type === 'alash_banner') {
        // Alash Party Banner
        const flagG = this.add.graphics().setDepth(5);
        flagG.fillStyle(0xC4A46C);
        flagG.fillRect(d.x - 2, d.y - 70, 4, 75);
        flagG.fillCircle(d.x, d.y - 72, 5);
        // Turquoise flag
        flagG.fillStyle(0x008080);
        flagG.fillRoundedRect(d.x + 2, d.y - 68, 62, 38, { tl: 0, tr: 4, bl: 0, br: 4 });
        flagG.lineStyle(1.5, 0xC4A46C, 0.9);
        flagG.strokeRoundedRect(d.x + 2, d.y - 68, 62, 38, { tl: 0, tr: 4, bl: 0, br: 4 });
        // Golden crescent & star
        flagG.fillStyle(0xFFD700);
        flagG.fillCircle(d.x + 22, d.y - 49, 7);
        flagG.fillStyle(0x008080);
        flagG.fillCircle(d.x + 25, d.y - 49, 6);
        flagG.fillStyle(0xFFD700);
        flagG.fillCircle(d.x + 36, d.y - 49, 3);
        this.add.text(d.x + 32, d.y - 40, 'ALASH', {
          fontFamily: 'Cinzel, Georgia, serif', fontSize: '9px', color: '#FFE8C0', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6);
      }
    });
  }

  createBuildings() {
    this.buildingBodies = [];
    BUILDINGS.forEach(b => {
      const g = this.add.graphics().setDepth(2);
      g.fillStyle(0x000000, 0.15);
      g.fillEllipse(b.x + b.w / 2, b.y + b.h + 3, b.w + 16, 14);

      if (b.id === 'alash_headquarters') {
        this.drawAlashHeadquarters(g, b);
      } else if (b.id === 'checkpoint_tower') {
        this.drawCheckpointTower(g, b);
      } else if (b.id === 'blacksmith') {
        this.drawBlacksmith(g, b);
      } else if (b.id === 'merchant_manor') {
        this.drawMerchantManor(g, b);
      } else if (b.type === 'yurt') {
        this.drawYurt(g, b.x + b.w / 2, b.y + b.h / 2, Math.min(b.w, b.h) / 2);
      } else if (b.type === 'brick') {
        g.fillStyle(b.color);
        g.fillRoundedRect(b.x, b.y + 6, b.w, b.h - 6, { tl: 0, tr: 0, bl: 3, br: 3 });
        g.fillStyle(0x5C3A1E);
        g.fillRect(b.x - 6, b.y - 4, b.w + 12, 18);
        g.fillStyle(0x3D2B1A);
        g.fillRoundedRect(b.x + b.w / 2 - 10, b.y + b.h - 22, 20, 22, { tl: 6, tr: 6, bl: 0, br: 0 });
        g.fillStyle(0xD4C5A9, 0.7);
        g.fillRoundedRect(b.x + 10, b.y + 28, 18, 18, 2);
        g.fillRoundedRect(b.x + b.w - 28, b.y + 28, 18, 18, 2);
      } else {
        g.fillStyle(b.color);
        g.fillRoundedRect(b.x, b.y + 8, b.w, b.h - 8, { tl: 0, tr: 0, bl: 3, br: 3 });
        g.fillStyle(0x5C3A1E);
        g.fillTriangle(b.x - 8, b.y + 8, b.x + b.w / 2, b.y - 26, b.x + b.w + 8, b.y + 8);
        g.fillStyle(0x4A3520);
        g.fillRoundedRect(b.x + b.w / 2 - 8, b.y + b.h - 20, 16, 20, { tl: 4, tr: 4, bl: 0, br: 0 });
        g.fillStyle(0xE8D5B0, 0.3);
        g.fillRoundedRect(b.x + 10, b.y + 22, 16, 16, 2);
        g.fillRoundedRect(b.x + b.w - 26, b.y + 22, 16, 16, 2);
      }

      const zone = this.add.zone(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h);
      this.physics.add.existing(zone, true);
      this.buildingBodies.push(zone);
    });
  }

  drawAlashHeadquarters(g, b) {
    // Grand Neoclassical 2-Story Alash Party Headquarters
    // Red brick facade
    g.fillStyle(0x8B3A3A);
    g.fillRoundedRect(b.x, b.y + 10, b.w, b.h - 10, 4);
    // Lower rusticated base
    g.fillStyle(0x602525);
    g.fillRect(b.x, b.y + b.h - 28, b.w, 28);

    // Stone quoin borders on edges
    g.fillStyle(0xD4C5A9);
    for (let qy = b.y + 14; qy < b.y + b.h - 10; qy += 18) {
      g.fillRect(b.x, qy, 10, 12);
      g.fillRect(b.x + b.w - 10, qy, 10, 12);
    }

    // Triangular neoclassical pediment
    g.fillStyle(0xD4C5A9);
    g.fillTriangle(b.x - 8, b.y + 10, b.x + b.w / 2, b.y - 28, b.x + b.w + 8, b.y + 10);
    g.fillStyle(0xC4A46C);
    g.fillCircle(b.x + b.w / 2, b.y - 6, 8); // Golden central sun emblem

    // Green copper cornice trim
    g.fillStyle(0x3B6858);
    g.fillRect(b.x - 6, b.y + 8, b.w + 12, 6);

    // 4 Classical white columns
    const colW = 12;
    const colY = b.y + 36;
    const colH = b.h - 48;
    const colPositions = [b.x + 32, b.x + 62, b.x + b.w - 74, b.x + b.w - 44];
    colPositions.forEach(cx => {
      g.fillStyle(0xEDE6D8);
      g.fillRect(cx, colY, colW, colH);
      g.fillStyle(0xD4C5A9);
      g.fillRect(cx - 3, colY, colW + 6, 6); // capital
      g.fillRect(cx - 3, colY + colH - 6, colW + 6, 6); // base
    });

    // 2nd floor arched windows with warm glowing light
    const winW = 18, winH = 26;
    const win2Y = b.y + 24;
    for (let wx = b.x + 22; wx < b.x + b.w - 30; wx += 28) {
      g.fillStyle(0xEDE6D8);
      g.fillRoundedRect(wx - 2, win2Y - 2, winW + 4, winH + 4, { tl: 8, tr: 8, bl: 0, br: 0 });
      g.fillStyle(0xFFD700, 0.45);
      g.fillRoundedRect(wx, win2Y, winW, winH, { tl: 6, tr: 6, bl: 0, br: 0 });
      g.lineStyle(1, 0x4A2E1A);
      g.strokeRoundedRect(wx, win2Y, winW, winH, { tl: 6, tr: 6, bl: 0, br: 0 });
    }

    // Grand entrance staircase and double walnut doors
    const doorW = 32, doorH = 34;
    const doorX = b.x + b.w / 2 - doorW / 2;
    const doorY = b.y + b.h - doorH;

    // Stone steps
    g.fillStyle(0xB5A48B);
    g.fillRect(doorX - 10, b.y + b.h - 6, doorW + 20, 8);
    g.fillRect(doorX - 6, b.y + b.h - 12, doorW + 12, 6);

    // Double doors
    g.fillStyle(0x3A2010);
    g.fillRoundedRect(doorX, doorY, doorW, doorH, { tl: 10, tr: 10, bl: 0, br: 0 });
    g.lineStyle(1.5, 0xC4A46C);
    g.strokeRoundedRect(doorX, doorY, doorW, doorH, { tl: 10, tr: 10, bl: 0, br: 0 });

    // Brass handles
    g.fillStyle(0xFFD700);
    g.fillCircle(doorX + doorW / 2 - 4, doorY + 18, 2);
    g.fillCircle(doorX + doorW / 2 + 4, doorY + 18, 2);

    // Signboard: ALASH PARTY HEADQUARTERS
    const signW = 140, signH = 18;
    const signX = b.x + b.w / 2 - signW / 2;
    const signY = b.y + 56;
    g.fillStyle(0x1a0a00, 0.95);
    g.fillRoundedRect(signX, signY, signW, signH, 4);
    g.lineStyle(1, 0xC4A46C, 0.9);
    g.strokeRoundedRect(signX, signY, signW, signH, 4);

    this.add.text(b.x + b.w / 2, signY + 9, 'ALASH PARTY HEADQUARTERS', {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '7.5px', color: '#FFE8C0', fontStyle: 'bold', letterSpacing: 1
    }).setOrigin(0.5).setDepth(4);
  }

  drawCheckpointTower(g, b) {
    // Frontier Post Timber Watchtower
    g.fillStyle(0x54361B);
    g.fillRect(b.x, b.y + 12, b.w, b.h - 12);
    // Timber cross-braces
    g.lineStyle(2, 0x3A220F);
    g.lineBetween(b.x + 4, b.y + 14, b.x + b.w - 4, b.y + b.h - 4);
    g.lineBetween(b.x + b.w - 4, b.y + 14, b.x + 4, b.y + b.h - 4);

    // Overhanging observation deck
    g.fillStyle(0x422912);
    g.fillRect(b.x - 6, b.y + 14, b.w + 12, 16);
    // Observation slit windows
    g.fillStyle(0x1A0A00);
    g.fillRect(b.x + 10, b.y + 18, 14, 8);
    g.fillRect(b.x + b.w - 24, b.y + 18, 14, 8);

    // Shingled watchtower roof
    g.fillStyle(0x2E1B0D);
    g.fillTriangle(b.x - 10, b.y + 14, b.x + b.w / 2, b.y - 18, b.x + b.w + 10, b.y + 14);

    // Frontier outpost lantern
    g.fillStyle(0xFFD700, 0.6);
    g.fillCircle(b.x + b.w / 2, b.y + 36, 4);
  }

  drawBlacksmith(g, b) {
    // Raiymbek's Forge
    g.fillStyle(0x52463E);
    g.fillRoundedRect(b.x, b.y + 8, b.w, b.h - 8, 3);
    // Brick forge chimney on right side
    g.fillStyle(0x7E3D2D);
    g.fillRect(b.x + b.w - 26, b.y - 18, 20, b.h + 18);
    g.fillStyle(0x5C2B1F);
    g.fillRect(b.x + b.w - 28, b.y - 22, 24, 6);

    // Pitch slate roof
    g.fillStyle(0x3B322C);
    g.fillTriangle(b.x - 6, b.y + 8, b.x + b.w / 2 - 10, b.y - 20, b.x + b.w - 18, b.y + 8);

    // Glowing forge window with firelight
    g.fillStyle(0xFF5500, 0.85);
    g.fillRoundedRect(b.x + 14, b.y + 24, 22, 20, 2);
    g.fillStyle(0xFFD700, 0.9);
    g.fillCircle(b.x + 25, b.y + 34, 6);

    // Heavy wooden door
    g.fillStyle(0x3D2B1A);
    g.fillRoundedRect(b.x + 50, b.y + b.h - 26, 20, 26, { tl: 4, tr: 4, bl: 0, br: 0 });
  }

  drawMerchantManor(g, b) {
    // Daulet-bai's Manor
    g.fillStyle(0xB89870);
    g.fillRoundedRect(b.x, b.y + 8, b.w, b.h - 8, 4);
    // Roof cornice with gilded trim
    g.fillStyle(0x6B4F37);
    g.fillRect(b.x - 6, b.y + 4, b.w + 12, 14);
    g.fillStyle(0xC4A46C);
    g.fillRect(b.x - 6, b.y + 6, b.w + 12, 3);

    // Arched bay windows with wrought iron grilles
    g.fillStyle(0xD4C5A9);
    g.fillRoundedRect(b.x + 14, b.y + 26, 22, 24, { tl: 8, tr: 8, bl: 0, br: 0 });
    g.fillRoundedRect(b.x + b.w - 36, b.y + 26, 22, 24, { tl: 8, tr: 8, bl: 0, br: 0 });
    g.lineStyle(1, 0x4A3520);
    g.strokeRoundedRect(b.x + 14, b.y + 26, 22, 24, { tl: 8, tr: 8, bl: 0, br: 0 });
    g.strokeRoundedRect(b.x + b.w - 36, b.y + 26, 22, 24, { tl: 8, tr: 8, bl: 0, br: 0 });

    // Double carved walnut door
    g.fillStyle(0x3D2614);
    g.fillRoundedRect(b.x + b.w / 2 - 13, b.y + b.h - 28, 26, 28, { tl: 6, tr: 6, bl: 0, br: 0 });
    g.lineStyle(1.5, 0xC4A46C);
  }

  drawYurt(g, cx, cy, r) {
    g.fillStyle(0x8B7355);
    g.fillCircle(cx, cy + r * 0.1, r * 1.08);
    g.fillStyle(0xD4C5A9);
    g.fillCircle(cx, cy, r);
    g.fillStyle(0x8B7355);
    g.fillCircle(cx, cy - r * 0.4, r * 0.68);
    g.fillStyle(0x6B5335);
    g.fillCircle(cx, cy - r * 0.78, r * 0.2);
    g.fillStyle(0x4A3520);
    g.fillRoundedRect(cx - 7, cy + r * 0.2, 14, r * 0.65, { tl: 4, tr: 4, bl: 0, br: 0 });
    g.fillStyle(0xC4A46C, 0.4);
    g.fillCircle(cx, cy - r * 0.98, 3);
  }

  // ==================== PLAYER & NPCs ====================
  createPlayer() {
    this.player = new Player(this, PLAYER_START.x, PLAYER_START.y);
    this.player.setDepth(10);
    this.physics.add.collider(this.player, this.buildingBodies);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(100, 80);
  }

  createNPCs() {
    this.npcs = [];
    NPCS.forEach(npcData => {
      const npc = new NPC(this, npcData.x, npcData.y, npcData.texture, npcData);
      this.npcs.push(npc);
      this.physics.add.collider(this.player, npc);
    });
  }

  // ==================== FRAGMENTS & EVIDENCE ====================
  createFragments() {
    this.fragments = [];
    const cm = this.chapterManager;
    if (cm.isChapterCompleted('ch1') || !cm.isChapterActive('ch1')) {
      return;
    }

    FRAGMENTS.forEach((fData, idx) => {
      const isThird = idx === 2;
      // Skip if already collected from previous save
      if (cm.isFragmentCollected(fData.id)) return;

      const glow = this.add.image(fData.x, fData.y, 'glow').setDepth(4).setAlpha(0.3).setScale(1.2);
      this.tweens.add({ targets: glow, alpha: { from: 0.35, to: 0.15 }, scaleX: { from: 1.2, to: 1.6 }, scaleY: { from: 1.2, to: 1.6 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      const f = this.add.image(fData.x, fData.y, 'fragment').setDepth(6);
      f.setData('id', fData.id);
      f.setData('isThird', isThird);
      this.tweens.add({ targets: f, y: fData.y - 3, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      this.fragments.push({
        sprite: f, glowLarge: glow, data: fData, collected: false, isThird: isThird
      });
    });
  }

  createEvidenceObjects() {
    if (this.evidenceObjects) {
      this.evidenceObjects.forEach(eo => {
        if (eo.marker) eo.marker.destroy();
        if (eo.label) eo.label.destroy();
      });
    }
    this.evidenceObjects = [];
    const cm = this.chapterManager;
    const currentChapter = cm.activeChapterId;

    // Filter evidence appropriate for current chapter or earlier
    const allowedChapters = {
      ch1: ['ch1'],
      ch2: ['ch1', 'ch2'],
      ch3: ['ch1', 'ch2', 'ch3'],
      ch4: ['ch1', 'ch2', 'ch3', 'ch4'],
      ch5: ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'],
      ch6: ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6'],
    }[currentChapter] || ['ch1'];

    EVIDENCE.forEach(ev => {
      // torn_manuscript is obtained by picking up the third fragment in Chapter 1
      if (ev.id === 'torn_manuscript') return;
      if (!allowedChapters.includes(ev.chapter)) return;
      if (cm.evidence[ev.id] && cm.evidence[ev.id].found) return;

      const pos = ev.foundAt;
      const marker = this.add.circle(pos.x, pos.y, 9, 0xC4A46C, 0.15).setDepth(4);
      this.tweens.add({
        targets: marker,
        alpha: { from: 0.25, to: 0.05 },
        scaleX: { from: 1, to: 1.7 },
        scaleY: { from: 1, to: 1.7 },
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      const label = this.add.text(pos.x, pos.y - 14, '?', {
        fontFamily: 'Cinzel, Georgia, serif',
        fontSize: '13px',
        color: '#C4A46C',
        stroke: '#2A1506',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(7);

      this.evidenceObjects.push({ marker, label, data: ev, pos, collected: false });
    });
  }

  // ==================== UI ====================
  createUI() {
    this.chapterPanel = this.add.graphics().setDepth(90).setScrollFactor(0);
    this.chapterTitleTxt = this.add.text(20, 16, '', { fontFamily: 'Cinzel, Georgia, serif', fontSize: '10px', color: '#C4A46C', letterSpacing: 2 }).setDepth(91).setScrollFactor(0);
    this.chapterDescTxt = this.add.text(20, 32, '', { fontFamily: 'Lora, Georgia, serif', fontSize: '13px', color: '#E8D5B0' }).setDepth(91).setScrollFactor(0);
    this.chapterProgressTxt = this.add.text(20, 50, '', { fontFamily: 'Lora, Georgia, serif', fontSize: '11px', color: '#A0896C' }).setDepth(91).setScrollFactor(0);

    this.pointsPanel = this.add.graphics().setDepth(90).setScrollFactor(0);
    this.pointsIcon = this.add.text(0, 16, '◆', { fontFamily: 'serif', fontSize: '14px', color: '#C4A46C' }).setDepth(91).setScrollFactor(0);
    this.pointsLabel = this.add.text(0, 16, 'HERITAGE', { fontFamily: 'Cinzel, Georgia, serif', fontSize: '9px', color: '#A0896C', letterSpacing: 1 }).setDepth(91).setScrollFactor(0);
    this.pointsValue = this.add.text(0, 30, '0', { fontFamily: 'Cinzel, Georgia, serif', fontSize: '22px', color: '#FFE8C0', stroke: '#2A1506', strokeThickness: 2 }).setDepth(91).setScrollFactor(0);

    this.interactText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 80, '', {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '16px', color: '#FFE8C0', stroke: '#2A1506', strokeThickness: 4, letterSpacing: 2,
    }).setOrigin(0.5).setDepth(91).setScrollFactor(0).setAlpha(0);

    // Evening overlay
    this.eveningOverlay = this.add.rectangle(
      this.cameras.main.width / 2, this.cameras.main.height / 2,
      this.cameras.main.width, this.cameras.main.height, 0x1A2A3A, 0
    ).setDepth(88).setScrollFactor(0);

    this.updateAllUI();
  }

  updateAllUI() {
    this.updateChapterPanel();
    this.updatePointsDisplay();
  }

  updateChapterPanel() {
    const cm = this.chapterManager;
    const ch = cm.getActiveChapter();
    if (!ch) {
      this.chapterPanel.clear();
      this.chapterTitleTxt.setText('');
      this.chapterDescTxt.setText('');
      this.chapterProgressTxt.setText('');
      return;
    }

    const px = 14, py = 10, pw = 280, ph = 74;
    this.chapterPanel.clear();
    this.chapterPanel.fillStyle(0x000000, 0.25);
    this.chapterPanel.fillRoundedRect(px + 2, py + 2, pw, ph, 8);
    this.chapterPanel.fillStyle(0x1a0a00, 0.92);
    this.chapterPanel.fillRoundedRect(px, py, pw, ph, 8);
    this.chapterPanel.lineStyle(1, 0xC4A46C, 0.5);
    this.chapterPanel.strokeRoundedRect(px, py, pw, ph, 8);
    this.chapterPanel.fillStyle(0xC4A46C, 0.12);
    this.chapterPanel.fillRoundedRect(px + 3, py + 3, pw - 6, 18, { tl: 6, tr: 6, bl: 0, br: 0 });

    this.chapterTitleTxt.setText(`CHAPTER ${ch.number} — ${ch.title.toUpperCase()}`);
    this.chapterDescTxt.setText(ch.objective);

    if (cm.isChapterActive('ch1')) {
      const p = cm.getChapterProgress();
      if (p >= 3) {
        this.chapterProgressTxt.setText('All 3 folios found! Return to the Archivist.');
      } else {
        this.chapterProgressTxt.setText(`Fragments: ${p}/3 recovered from the village`);
      }
    } else if (cm.isChapterActive('ch2')) {
      this.chapterProgressTxt.setText(`Questioned: ${cm.getInterviewedCount()}/3 | Avg Trust: ${cm.getAverageTrust()}%`);
    } else if (cm.isChapterActive('ch3')) {
      this.chapterProgressTxt.setText(`Evidence: ${cm.getEvidenceCount()} | Deductions: ${cm.getDeductionCount()} (TAB: Case File)`);
    } else if (cm.isChapterActive('ch4')) {
      this.chapterProgressTxt.setText('Speak with the Village Elder to learn where it was hidden.');
    } else if (cm.isChapterActive('ch5')) {
      const cacheDiscovered = cm.evidence['cache_marks'] && cm.evidence['cache_marks'].found;
      const chestDiscovered = cm.evidence['archivist_chest'] && cm.evidence['archivist_chest'].found;
      if (!cacheDiscovered) {
        this.chapterProgressTxt.setText('Investigate the stone cache south of the old well.');
      } else if (!chestDiscovered) {
        this.chapterProgressTxt.setText('Cache is empty! Search the archive exterior for clues.');
      } else {
        this.chapterProgressTxt.setText('Confront the Archivist about the packed travel chest!');
      }
    } else if (cm.isChapterActive('ch6')) {
      if (!cm.companion) {
        this.chapterProgressTxt.setText('Speak with candidates in the village to choose your companion (Sadyk, Mukhamet, Raiymbek, Daulet-bai).');
      } else if (!this.ambushResolved) {
        this.chapterProgressTxt.setText(`Riding with ${this.getNpcDisplayName(cm.companion)}. Ride east across the Steppe Road.`);
      } else if (!cm.isCheckpointPassed()) {
        this.chapterProgressTxt.setText('Approach the Frontier Post and secure passage to Semey.');
      } else {
        this.chapterProgressTxt.setText('Deliver Abai’s manuscript to Alikhan Bokeikhanov at the Alash Headquarters!');
      }
    } else {
      this.chapterProgressTxt.setText('Investigation complete.');
    }
  }

  updatePointsDisplay() {
    const w = this.cameras.main.width;
    const pw = 95, ph = 52, px = w - pw - 14, py = 10;
    const points = this.chapterManager.getPoints();

    this.pointsPanel.clear();
    this.pointsPanel.fillStyle(0x000000, 0.25);
    this.pointsPanel.fillRoundedRect(px + 2, py + 2, pw, ph, 8);
    this.pointsPanel.fillStyle(0x1a0a00, 0.92);
    this.pointsPanel.fillRoundedRect(px, py, pw, ph, 8);
    this.pointsPanel.lineStyle(1, 0xC4A46C, 0.5);
    this.pointsPanel.strokeRoundedRect(px, py, pw, ph, 8);

    this.pointsIcon.setPosition(px + 12, py + 6);
    this.pointsLabel.setPosition(px + 28, py + 8);
    this.pointsValue.setPosition(px + pw / 2, py + 24).setOrigin(0.5, 0);
    this.pointsValue.setText(`${points}`);
  }

  // ==================== INPUT ====================
  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
    this.xKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    this.interactKey.on('down', () => {
      if (!this.dialogueActive && this.interactionTarget && !this.showingChoices && !this.showingEvidenceMenu) {
        this.handleInteraction(this.interactionTarget);
      } else if (this.dialogueActive && !this.showingChoices && !this.showingEvidenceMenu) {
        this.advanceDialogue();
      }
    });
    this.spaceKey.on('down', () => {
      if (this.dialogueActive && !this.showingChoices && !this.showingEvidenceMenu) this.advanceDialogue();
    });
    this.enterKey.on('down', () => {
      if (this.dialogueActive && !this.showingChoices && !this.showingEvidenceMenu) this.advanceDialogue();
    });
    this.escKey.on('down', () => {
      if (this.showingEvidenceMenu) {
        this.closeEvidenceMenu();
      } else if (this.dialogueActive && !this.showingChoices) {
        this.closeDialogue();
      }
    });
    this.xKey.on('down', () => {
      if (this.dialogueActive && !this.showingChoices && !this.showingEvidenceMenu) {
        this.openPresentEvidenceMenu(this.currentDialogueNpcKey);
      }
    });
    this.tabKey.on('down', () => {
      if (!this.dialogueActive && !this.showingChoices && !this.showingEvidenceMenu && !this.scene.isPaused() && !this.scene.isActive('EvidenceBoardScene')) {
        this.scene.pause();
        this.scene.launch('EvidenceBoardScene', { gameScene: this });
      }
    });
  }

  // ==================== INTERACTIONS ====================
  checkInteractions() {
    if (this.dialogueActive || this.showingChoices) return;

    let closest = null;
    let closestDist = 55;

    // Check NPCs
    for (const npc of this.npcs) {
      if (!npc.visible) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (dist < closestDist) { closestDist = dist; closest = { type: 'npc', target: npc }; }
    }

    // Check fragments (Chapter 1)
    if (this.chapterManager.isChapterActive('ch1')) {
      for (const f of this.fragments) {
        if (f.collected) continue;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, f.data.x, f.data.y);
        if (dist < 50 && dist < closestDist) { closestDist = dist; closest = { type: 'fragment', target: f }; }
      }
    }

    // Check evidence objects (Chapters 2+)
    if (!this.chapterManager.isChapterActive('ch1')) {
      for (const eo of this.evidenceObjects) {
        if (eo.collected) continue;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, eo.pos.x, eo.pos.y);
        if (dist < 48 && dist < closestDist) { closestDist = dist; closest = { type: 'evidence', target: eo }; }
      }
    }

    if (closest) {
      this.interactionTarget = closest;
      this.interactText.setText('[E] INTERACT');
      if (this.interactText.alpha < 0.1) {
        this.interactText.setAlpha(1);
        this.tweens.add({ targets: this.interactText, alpha: { from: 0.7, to: 1 }, duration: 600, yoyo: true, repeat: -1 });
      }
    } else {
      this.interactionTarget = null;
      this.tweens.killTweensOf(this.interactText);
      this.interactText.setAlpha(0);
    }
  }

  handleInteraction(target) {
    if (target.type === 'npc') this.interactWithNPC(target.target);
    else if (target.type === 'fragment') this.collectFragment(target.target);
    else if (target.type === 'evidence') this.collectEvidence(target.target);
  }

  // ==================== NPC INTERACTION ====================
  interactWithNPC(npc) {
    const key = npc.getDialogKey();
    const cm = this.chapterManager;

    // Chapter 1: Flow
    if (cm.isChapterActive('ch1')) {
      if (key === 'archivist') {
        if (cm.getChapterProgress() >= 3) {
          this.startDialogue(key, 'chapter1_missing', () => {
            cm.completeChapter('ch1');
            this.createEvidenceObjects();
            this.updateAllUI();
            this.showQuestCompleteEffect(
              'CHAPTER 1 COMPLETE',
              'The third page was sliced out with a quill knife.\nQuestion the villagers to find out why.',
              '+10 Heritage Points'
            );
          });
          return;
        }
        this.startDialogue(key, 'chapter1_start');
        return;
      }
      this.startDialogue(key, 'greeting');
      return;
    }

    // Chapter 2: Interviews with trust choices
    if (cm.isChapterActive('ch2') && INTERVIEW_CHOICES[key]) {
      if (!cm.isNPCInterviewed(key)) {
        this.startDialogueData(INTERVIEW_CHOICES[key].intro, () => {
          this.showInterviewChoices(key);
        });
      } else {
        if (cm.getInterviewedCount() >= 3) {
          cm.completeChapter('ch2');
          this.createEvidenceObjects();
          this.updateAllUI();
          this.showQuestCompleteEffect(
            'CHAPTER 2 COMPLETE',
            'All three villagers questioned.\nInvestigate clues and connect them on the Case File (TAB).',
            '+10 Heritage Points'
          );
        } else {
          this.startDialogue(key, 'greeting');
        }
      }
      return;
    }

    // Chapter 3: Puzzle minigame with Archivist, clues with Teacher
    if (cm.isChapterActive('ch3')) {
      const hasCopyistDeduction = cm.getDeductions().some(d =>
        d.result.toLowerCase().includes('copyist') || d.result.toLowerCase().includes('scribe')
      );
      if (cm.getEvidenceCount() >= 4 && hasCopyistDeduction) {
        cm.completeChapter('ch3');
        this.createEvidenceObjects();
        this.updateAllUI();
        this.showQuestCompleteEffect(
          'CHAPTER 3 COMPLETE',
          'The secret is revealed: the page holds 12 names!\nSpeak with the Elder to discover where it was hidden.',
          '+15 Heritage Points'
        );
        return;
      }
      if (key === 'archivist') {
        if (!cm.puzzleSolved) {
          this.startDialogue(key, 'puzzleOffer', () => {
            this.scene.pause();
            this.scene.launch('PuzzleScene', { gameScene: this });
          });
          return;
        }
        this.startDialogue(key, 'greeting');
        return;
      }
      if (key === 'teacher') {
        this.startDialogue(key, 'chapter3_start');
        return;
      }
    }

    // Chapter 4: Nightfall & Elder confession
    if (cm.isChapterActive('ch4')) {
      if (key === 'elder') {
        this.startDialogue(key, 'chapter4_start', () => {
          cm.setEvening(true);
          this.applyEveningTransition();
          cm.completeChapter('ch4');
          this.createEvidenceObjects();
          this.updateAllUI();
          this.showQuestCompleteEffect(
            'CHAPTER 4 COMPLETE',
            'The Elder revealed the secret cache by the well!\nGo to the old well to recover the page.',
            '+15 Heritage Points'
          );
        });
        return;
      }
    }

    // Chapter 5: The Empty Cache & Confronting Archivist
    if (cm.isChapterActive('ch5')) {
      const cacheDiscovered = cm.evidence['cache_marks'] && cm.evidence['cache_marks'].found;
      const chestDiscovered = cm.evidence['archivist_chest'] && cm.evidence['archivist_chest'].found;

      if (key === 'elder') {
        if (cacheDiscovered) {
          this.startDialogue(key, 'chapter5_shock');
        } else {
          this.startDialogue(key, 'chapter5_prompt');
        }
        return;
      }
      if (key === 'archivist') {
        if (chestDiscovered) {
          this.startDialogue(key, 'chapter5_confront', () => {
            cm.completeChapter('ch5');
            this.updateAllUI();
            this.showQuestCompleteEffect(
              'CHAPTER 5 COMPLETE',
              'The missing page is recovered!\nSpeak with the Elder to decide its fate.',
              '+15 Heritage Points'
            );
          });
        } else {
          this.startDialogue(key, 'chapter5_busy');
        }
        return;
      }
    }

    // Chapter 6: The Road to Semey
    if (cm.isChapterActive('ch6')) {
      if (key === 'elder') {
        this.startDialogue(key, 'chapter6_start', () => {
          this.updateAllUI();
        });
        return;
      }
      if (['sadyk', 'mukhamet', 'raiymbek', 'dauletbai'].includes(key)) {
        if (!cm.companion) {
          this.startDialogue(key, 'chapter6_offer', () => {
            this.showCompanionRecruitmentModal(key);
          });
        } else if (cm.companion === key) {
          this.startDialogueData([
            { speaker: this.getNpcDisplayName(key), text: 'I am ready to ride with you! Let us head east through the ravine toward Semey.' }
          ]);
        } else {
          this.startDialogueData([
            { speaker: this.getNpcDisplayName(key), text: 'You have already chosen another companion. Safe travels to Semey!' }
          ]);
        }
        return;
      }
      if (key === 'antagonist_road') {
        this.triggerRoadAmbush();
        return;
      }
      if (key === 'post_sentry') {
        this.triggerCheckpointEncounter();
        return;
      }
      if (key === 'alash_leader') {
        this.triggerAlashArrival();
        return;
      }
    }

    // Default greeting for other NPCs
    this.startDialogue(key, 'greeting');
  }

  // ==================== INTERVIEW CHOICES (Chapter 2) ====================
  showInterviewChoices(npcKey) {
    this.showingChoices = true;
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const choices = INTERVIEW_CHOICES[npcKey].choices;

    this.choiceContainer = this.add.container(0, 0).setDepth(100).setScrollFactor(0);

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.55).setScrollFactor(0).setInteractive();
    this.choiceContainer.add(overlay);

    const panelW = 580, panelH = 290, px = w / 2, py = h / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x2A1506, 0.98);
    panel.fillRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    panel.lineStyle(2, 0xC4A46C, 0.8);
    panel.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    this.choiceContainer.add(panel);

    const title = this.add.text(px, py - panelH / 2 + 22, `◆  QUESTION ${npcKey.toUpperCase()}  ◆`, {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '16px', color: '#C4A46C', letterSpacing: 2,
    }).setOrigin(0.5);
    this.choiceContainer.add(title);

    const hint = this.add.text(px, py - panelH / 2 + 40, 'Press [A], [B], [C] or click to select', {
      fontFamily: 'Lora, Georgia, serif', fontSize: '11px', color: '#A0896C', fontStyle: 'italic',
    }).setOrigin(0.5);
    this.choiceContainer.add(hint);

    choices.forEach((choice, i) => {
      const by = py - 32 + i * 64;
      const bw = panelW - 50, bh = 46;

      const btnBg = this.add.graphics();
      btnBg.fillStyle(0x3D2B1A, 0.95);
      btnBg.fillRoundedRect(px - bw / 2, by - bh / 2, bw, bh, 8);
      btnBg.lineStyle(1, 0x8B7355, 0.6);
      btnBg.strokeRoundedRect(px - bw / 2, by - bh / 2, bw, bh, 8);
      this.choiceContainer.add(btnBg);

      const optionText = choice.label || choice.text || '';
      const label = `${['A', 'B', 'C'][i]}. ${optionText}`;
      const btnText = this.add.text(px, by, label, {
        fontFamily: 'Lora, Georgia, serif', fontSize: '13px', color: '#D4C5A9',
        wordWrap: { width: bw - 30 }, align: 'center',
      }).setOrigin(0.5);
      this.choiceContainer.add(btnText);

      const hitArea = this.add.rectangle(px, by, bw, bh, 0x000000, 0.01).setScrollFactor(0).setInteractive({ useHandCursor: true });
      this.choiceContainer.add(hitArea);

      hitArea.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(0x5C3A1E, 0.98);
        btnBg.fillRoundedRect(px - bw / 2, by - bh / 2, bw, bh, 8);
        btnBg.lineStyle(2, 0xC4A46C, 0.9);
        btnBg.strokeRoundedRect(px - bw / 2, by - bh / 2, bw, bh, 8);
        btnText.setColor('#FFE8C0');
      });
      hitArea.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(0x3D2B1A, 0.95);
        btnBg.fillRoundedRect(px - bw / 2, by - bh / 2, bw, bh, 8);
        btnBg.lineStyle(1, 0x8B7355, 0.6);
        btnBg.strokeRoundedRect(px - bw / 2, by - bh / 2, bw, bh, 8);
        btnText.setColor('#D4C5A9');
      });
      hitArea.on('pointerdown', () => {
        this.handleInterviewChoice(npcKey, choice);
      });
    });

    // Keyboard shortcuts for choices: A, B, C (or 1, 2, 3)
    this.choiceKeyHandlers = [];
    const keyCodes = [
      [Phaser.Input.Keyboard.KeyCodes.A, Phaser.Input.Keyboard.KeyCodes.ONE],
      [Phaser.Input.Keyboard.KeyCodes.B, Phaser.Input.Keyboard.KeyCodes.TWO],
      [Phaser.Input.Keyboard.KeyCodes.C, Phaser.Input.Keyboard.KeyCodes.THREE]
    ];

    choices.forEach((choice, i) => {
      if (keyCodes[i]) {
        keyCodes[i].forEach(code => {
          const keyObj = this.input.keyboard.addKey(code);
          const onDown = () => {
            if (this.showingChoices) {
              this.handleInterviewChoice(npcKey, choice);
            }
          };
          keyObj.once('down', onDown);
          this.choiceKeyHandlers.push({ keyObj, onDown });
        });
      }
    });
  }

  cleanupChoiceKeys() {
    if (this.choiceKeyHandlers) {
      this.choiceKeyHandlers.forEach(({ keyObj, onDown }) => {
        keyObj.off('down', onDown);
      });
      this.choiceKeyHandlers = [];
    }
  }

  handleInterviewChoice(npcKey, choice) {
    this.cleanupChoiceKeys();
    if (this.choiceContainer) { this.choiceContainer.destroy(); this.choiceContainer = null; }
    this.showingChoices = false;

    const cm = this.chapterManager;
    cm.adjustTrust(npcKey, choice.trust);
    cm.markNPCInterviewed(npcKey);

    // Immediately update UI so interviewed count and trust change right away!
    this.updateAllUI();

    this.startDialogueData(choice.reply, () => {
      this.updateAllUI();
      if (cm.getInterviewedCount() >= 3 && cm.isChapterActive('ch2')) {
        cm.completeChapter('ch2');
        this.createEvidenceObjects();
        this.updateAllUI();
        this.showQuestCompleteEffect(
          'CHAPTER 2 COMPLETE',
          'All three villagers questioned.\nInvestigate clues and connect them on the Case File (TAB).',
          '+10 Heritage Points'
        );
      }
    });
  }

  // ==================== COLLECTION ====================
  collectFragment(fragment) {
    if (fragment.collected) return;
    fragment.collected = true;

    this.tweens.killTweensOf(fragment.sprite);
    if (fragment.glowLarge) this.tweens.killTweensOf(fragment.glowLarge);

    this.tweens.add({
      targets: [fragment.sprite, fragment.glowLarge],
      alpha: 0, scaleX: 1.8, scaleY: 1.8, duration: 350, ease: 'Cubic.easeOut',
      onComplete: () => {
        if (fragment.sprite) fragment.sprite.destroy();
        if (fragment.glowLarge) fragment.glowLarge.destroy();
      }
    });

    const isThird = fragment.isThird;
    const notifContainer = this.add.container(fragment.data.x, fragment.data.y).setDepth(20);
    const notifBg = this.add.graphics();
    notifBg.fillStyle(0x1a0a00, 0.9);
    notifBg.fillRoundedRect(-75, -20, 150, 40, 8);
    notifBg.lineStyle(1, 0xC4A46C, 0.8);
    notifBg.strokeRoundedRect(-75, -20, 150, 40, 8);
    notifContainer.add(notifBg);

    const titleStr = isThird ? 'TORN FRAGMENT' : 'MANUSCRIPT';
    const subStr = isThird ? 'EDGE CUT WITH KNIFE' : 'PAGE RECOVERED';
    notifContainer.add(this.add.text(0, -9, titleStr, { fontFamily: 'Cinzel, Georgia, serif', fontSize: '11px', color: '#C4A46C', letterSpacing: 2 }).setOrigin(0.5));
    notifContainer.add(this.add.text(0, 9, subStr, { fontFamily: 'Lora, Georgia, serif', fontSize: '11px', color: '#FFE8C0' }).setOrigin(0.5));

    this.tweens.add({ targets: notifContainer, y: notifContainer.y - 30, alpha: { from: 1, to: 0 }, duration: 2000, delay: 500, ease: 'Cubic.easeOut', onComplete: () => notifContainer.destroy() });

    const cm = this.chapterManager;
    cm.collectFragment(fragment.data.id);

    if (isThird) {
      cm.discoverEvidence('torn_manuscript');
    }

    this.updateAllUI();
  }

  collectEvidence(eo) {
    if (eo.collected) return;
    const cm = this.chapterManager;
    const result = cm.discoverEvidence(eo.data.id);
    if (!result) return;

    eo.collected = true;
    this.tweens.add({ targets: [eo.marker, eo.label], alpha: 0, duration: 400, onComplete: () => { eo.marker.destroy(); eo.label.destroy(); } });

    // Notification
    const w = this.cameras.main.width;
    const container = this.add.container(w / 2, this.cameras.main.height / 2).setDepth(100).setScrollFactor(0);
    const panelW = 380, panelH = 120;

    const bg = this.add.graphics();
    bg.fillStyle(0x2A1506, 0.97);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 12);
    bg.lineStyle(2, 0xC4A46C, 0.8);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 12);
    container.add(bg);

    container.add(this.add.text(0, -34, '◆  EVIDENCE DISCOVERED  ◆', {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '13px', color: '#C4A46C', letterSpacing: 1,
    }).setOrigin(0.5));
    container.add(this.add.text(0, -8, result.name, {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '16px', color: '#FFE8C0',
    }).setOrigin(0.5));
    container.add(this.add.text(0, 16, result.description, {
      fontFamily: 'Lora, Georgia, serif', fontSize: '12px', color: '#D4C5A9',
      wordWrap: { width: panelW - 40 }, align: 'center',
    }).setOrigin(0.5));
    container.add(this.add.text(0, panelH / 2 - 18, '+5 Heritage Points  |  Press TAB for Case File', {
      fontFamily: 'Lora, Georgia, serif', fontSize: '10.5px', color: '#A0896C', fontStyle: 'italic',
    }).setOrigin(0.5));

    this.tweens.add({ targets: container, alpha: { from: 1, to: 0 }, duration: 600, delay: 4000, onComplete: () => container.destroy() });

    this.updateAllUI();

    // Prevent soft-lock: Check if Chapter 3 conditions are met upon collecting evidence
    const hasCopyistDeduction = cm.getDeductions().some(d =>
      d.result.toLowerCase().includes('copyist') || d.result.toLowerCase().includes('scribe')
    );
    if (cm.isChapterActive('ch3') && cm.getEvidenceCount() >= 4 && hasCopyistDeduction) {
      this.time.delayedCall(1200, () => {
        if (cm.isChapterActive('ch3')) {
          cm.completeChapter('ch3');
          this.createEvidenceObjects();
          this.updateAllUI();
          this.showQuestCompleteEffect(
            'CHAPTER 3 COMPLETE',
            'The secret is revealed: the page holds 12 names!\nSpeak with the Elder to discover where it was hidden.',
            '+15 Heritage Points'
          );
        }
      });
    }
  }

  // ==================== DAY/NIGHT TRANSITION ====================
  applyEveningTransition(instant = false) {
    if (!this.eveningOverlay) return;
    if (this.eveningApplied) return;
    this.eveningApplied = true;

    if (instant) {
      this.eveningOverlay.setAlpha(0.38);
    } else {
      this.tweens.add({
        targets: this.eveningOverlay,
        alpha: 0.38,
        duration: 2000,
        ease: 'Cubic.easeInOut',
      });
    }

    // Lantern light effect near archive, well, manor, and elder's house
    const lanternPositions = [
      { x: 2050, y: 390 },
      { x: 1150, y: 920 },
      { x: 1495, y: 350 },
      { x: 350, y: 365 },
    ];

    lanternPositions.forEach(pos => {
      const lantern = this.add.circle(pos.x, pos.y, 65, 0xFFD700, 0.08).setDepth(2);
      this.tweens.add({
        targets: lantern,
        alpha: { from: 0.06, to: 0.12 },
        scaleX: { from: 1, to: 1.25 },
        scaleY: { from: 1, to: 1.25 },
        duration: 2200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  // ==================== DIALOGUE ====================
  startDialogue(npcKey, dialogKey, onComplete) {
    this.currentDialogueNpcKey = npcKey;
    const dialogueData = DIALOGUE[npcKey];
    if (!dialogueData || !dialogueData[dialogKey]) {
      if (onComplete) onComplete();
      return;
    }
    this.startDialogueData(dialogueData[dialogKey], onComplete);
  }

  startDialogueData(messages, onComplete) {
    this.dialogueQueue = [...messages];
    this.dialogueIndex = 0;
    this.dialogueActive = true;
    this.dialogueCompleteCb = onComplete || null;
    this.interactText.setAlpha(0);
    this.tweens.killTweensOf(this.interactText);
    this.createDialogueBox();
    this.showCurrentDialogue();
  }

  createDialogueBox() {
    if (this.dialogueContainer) this.dialogueContainer.destroy();
    const w = this.cameras.main.width, h = this.cameras.main.height;
    this.dialogueContainer = this.add.container(0, 0).setDepth(95).setScrollFactor(0);

    const boxW = w - 80, boxH = 155, bx = (w - boxW) / 2, by = h - boxH - 25;

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(bx + 3, by + 3, boxW, boxH, 12);
    this.dialogueContainer.add(shadow);

    const bg = this.add.graphics();
    bg.fillStyle(0x2A1A0A, 0.98);
    bg.fillRoundedRect(bx, by, boxW, boxH, 12);
    bg.lineStyle(2, 0xC4A46C, 0.7);
    bg.strokeRoundedRect(bx, by, boxW, boxH, 12);
    bg.lineStyle(1, 0x8B7355, 0.3);
    bg.strokeRoundedRect(bx + 5, by + 5, boxW - 10, boxH - 10, 8);
    bg.fillStyle(0xC4A46C, 0.08);
    bg.fillRoundedRect(bx + 6, by + 6, boxW - 12, 22, { tl: 7, tr: 7, bl: 0, br: 0 });
    this.dialogueContainer.add(bg);

    this.speakerText = this.add.text(bx + 20, by + 12, '', { fontFamily: 'Cinzel, Georgia, serif', fontSize: '12px', color: '#C4A46C', letterSpacing: 2 });
    this.dialogueContainer.add(this.speakerText);

    this.dialogueContentText = this.add.text(bx + 20, by + 44, '', { fontFamily: 'Lora, Georgia, serif', fontSize: '15px', color: '#E8D5B0', wordWrap: { width: boxW - 48 }, lineSpacing: 5 });
    this.dialogueContainer.add(this.dialogueContentText);

    // Present evidence button [X]
    const presentBtn = this.add.text(bx + 20, by + boxH - 24, '[X] PRESENT EVIDENCE', {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '11px', color: '#D4C5A9', letterSpacing: 1
    }).setScrollFactor(0).setInteractive({ useHandCursor: true });
    presentBtn.on('pointerover', () => presentBtn.setColor('#FFD700'));
    presentBtn.on('pointerout', () => presentBtn.setColor('#D4C5A9'));
    presentBtn.on('pointerdown', (e) => {
      if (e && e.event) e.event.stopPropagation();
      this.openPresentEvidenceMenu(this.currentDialogueNpcKey);
    });
    this.dialogueContainer.add(presentBtn);

    this.continueHint = this.add.text(bx + boxW - 22, by + boxH - 24, '▶ [SPACE / CLICK]', { fontFamily: 'Cinzel, Georgia, serif', fontSize: '11px', color: '#C4A46C' }).setOrigin(1, 0).setAlpha(0);
    this.dialogueContainer.add(this.continueHint);

    // Click area across entire dialogue box
    const clickArea = this.add.rectangle(bx + boxW / 2, by + boxH / 2, boxW, boxH, 0x000000, 0.001)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    clickArea.on('pointerdown', () => {
      if (this.dialogueActive && !this.showingChoices && !this.showingEvidenceMenu) this.advanceDialogue();
    });
    this.dialogueContainer.add(clickArea);
    this.dialogueContainer.setScrollFactor(0, 0, true);
  }

  showCurrentDialogue() {
    if (this.dialogueIndex >= this.dialogueQueue.length) { this.closeDialogue(); return; }
    soundManager.playPaperRustle();
    const msg = this.dialogueQueue[this.dialogueIndex];
    this.speakerText.setText('◆  ' + msg.speaker.toUpperCase());
    this.continueHint.setAlpha(0);
    this.tweens.killTweensOf(this.continueHint);
    this.typeText(msg.text, () => {
      this.continueHint.setAlpha(0.6);
      this.tweens.add({ targets: this.continueHint, alpha: { from: 0.3, to: 0.8 }, duration: 500, yoyo: true, repeat: -1 });
    });
  }

  typeText(text, onComplete) {
    this.isTyping = true;
    this.dialogueContentText.setText('');
    let charIndex = 0;
    if (this.typeTimer) this.typeTimer.destroy();
    this.typeTimer = this.time.addEvent({
      delay: 18,
      callback: () => {
        if (charIndex < text.length) { this.dialogueContentText.setText(text.substring(0, charIndex + 1)); charIndex++; }
        else { this.typeTimer.destroy(); this.isTyping = false; if (onComplete) onComplete(); }
      },
      repeat: text.length - 1,
    });
  }

  advanceDialogue() {
    if (this.isTyping) {
      if (this.typeTimer) this.typeTimer.destroy();
      this.dialogueContentText.setText(this.dialogueQueue[this.dialogueIndex].text);
      this.isTyping = false;
      this.continueHint.setAlpha(0.6);
      this.tweens.add({ targets: this.continueHint, alpha: { from: 0.3, to: 0.8 }, duration: 500, yoyo: true, repeat: -1 });
      return;
    }
    this.tweens.killTweensOf(this.continueHint);
    this.dialogueIndex++;
    this.showCurrentDialogue();
  }

  closeDialogue() {
    this.dialogueActive = false;
    this.isTyping = false;
    if (this.typeTimer) this.typeTimer.destroy();
    if (this.dialogueContainer) { this.dialogueContainer.destroy(); this.dialogueContainer = null; }
    const cb = this.dialogueCompleteCb;
    this.dialogueCompleteCb = null;
    if (cb) cb();
  }

  // ==================== EFFECTS ====================
  showQuestCompleteEffect(title, message, points) {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    const container = this.add.container(0, 0).setDepth(100).setScrollFactor(0);
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.55).setInteractive();
    container.add(overlay);

    const panelW = 440, panelH = 200, px = w / 2, py = h / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x2A1506, 0.98);
    panel.fillRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    panel.lineStyle(2, 0xC4A46C, 0.8);
    panel.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    container.add(panel);

    const icon = this.add.text(px, py - 52, '◆', { fontFamily: 'serif', fontSize: '24px', color: '#C4A46C' }).setOrigin(0.5).setScale(0);
    container.add(icon);
    this.tweens.add({ targets: icon, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });

    container.add(this.add.text(px, py - 22, title, { fontFamily: 'Cinzel, Georgia, serif', fontSize: '19px', color: '#C4A46C', letterSpacing: 2 }).setOrigin(0.5));
    container.add(this.add.text(px, py + 12, message, { fontFamily: 'Lora, Georgia, serif', fontSize: '13.5px', color: '#D4C5A9', align: 'center', lineSpacing: 4 }).setOrigin(0.5));
    if (points) container.add(this.add.text(px, py + 58, points, { fontFamily: 'Cinzel, Georgia, serif', fontSize: '16px', color: '#FFE8C0' }).setOrigin(0.5));

    this.time.delayedCall(4000, () => {
      this.tweens.add({ targets: container, alpha: 0, duration: 400, onComplete: () => container.destroy() });
    });
  }

  createAmbientParticles() {
    this.add.particles(0, 0, 'particle', { x: { min: 0, max: MAP_WIDTH }, y: { min: 0, max: MAP_HEIGHT }, lifespan: { min: 5000, max: 10000 }, speed: { min: 1, max: 6 }, scale: { start: 0.5, end: 0 }, alpha: { start: 0.12, end: 0 }, frequency: 500, quantity: 1, tint: 0xE8D5B0 }).setDepth(1);
    this.add.particles(0, 0, 'particle', { x: { min: 0, max: MAP_WIDTH }, y: { min: 0, max: MAP_HEIGHT }, lifespan: { min: 6000, max: 12000 }, speed: { min: 2, max: 10 }, scale: { start: 0.4, end: 0 }, alpha: { start: 0.15, end: 0 }, frequency: 900, quantity: 1, tint: 0xFFE8C0 }).setDepth(1);
  }

  // ==================== CHAPTER 6: RECRUITMENT & ROAD JOURNEY ====================
  showCompanionRecruitmentModal(candidateKey) {
    this.showingChoices = true;
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const candidateData = COMPANIONS.find(c => c.id === candidateKey) || {
      name: candidateKey,
      title: candidateKey,
      desc: '',
      virtue: ''
    };

    const container = this.add.container(0, 0).setDepth(100).setScrollFactor(0);
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6).setScrollFactor(0).setInteractive();
    container.add(overlay);

    const panelW = 560, panelH = 260, px = w / 2, py = h / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x2A1506, 0.98);
    panel.fillRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    panel.lineStyle(2, 0xC4A46C, 0.85);
    panel.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    container.add(panel);

    const title = this.add.text(px, py - panelH / 2 + 25, '◆  CHOOSE YOUR JOURNEY COMPANION  ◆', {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '15px', color: '#C4A46C', letterSpacing: 2
    }).setOrigin(0.5);
    container.add(title);

    const candName = this.add.text(px, py - panelH / 2 + 55, candidateData.title, {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '17px', color: '#FFE8C0'
    }).setOrigin(0.5);
    container.add(candName);

    const candDesc = this.add.text(px, py - panelH / 2 + 90, candidateData.desc, {
      fontFamily: 'Lora, Georgia, serif', fontSize: '12.5px', color: '#D4C5A9', align: 'center',
      wordWrap: { width: panelW - 50 }
    }).setOrigin(0.5);
    container.add(candDesc);

    // Buttons: [A] RECRUIT, [B] THINK MORE
    const btnW = 230, btnH = 42;
    const btnY = py + panelH / 2 - 42;

    // Button A
    const btnABg = this.add.graphics();
    btnABg.fillStyle(0x3D2B1A, 0.95);
    btnABg.fillRoundedRect(px - btnW - 10, btnY - btnH / 2, btnW, btnH, 8);
    btnABg.lineStyle(1.5, 0xC4A46C, 0.8);
    btnABg.strokeRoundedRect(px - btnW - 10, btnY - btnH / 2, btnW, btnH, 8);
    container.add(btnABg);

    const btnATxt = this.add.text(px - btnW / 2 - 10, btnY, '[A] RECRUIT COMPANION', {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '12px', color: '#FFE8C0', letterSpacing: 1
    }).setOrigin(0.5);
    container.add(btnATxt);

    const hitA = this.add.rectangle(px - btnW / 2 - 10, btnY, btnW, btnH, 0x000000, 0.01)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    container.add(hitA);

    // Button B
    const btnBBg = this.add.graphics();
    btnBBg.fillStyle(0x2A1506, 0.95);
    btnBBg.fillRoundedRect(px + 10, btnY - btnH / 2, btnW, btnH, 8);
    btnBBg.lineStyle(1, 0x8B7355, 0.6);
    btnBBg.strokeRoundedRect(px + 10, btnY - btnH / 2, btnW, btnH, 8);
    container.add(btnBBg);

    const btnBTxt = this.add.text(px + btnW / 2 + 10, btnY, '[B] CONSIDER OTHERS', {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '12px', color: '#D4C5A9', letterSpacing: 1
    }).setOrigin(0.5);
    container.add(btnBTxt);

    const hitB = this.add.rectangle(px + btnW / 2 + 10, btnY, btnW, btnH, 0x000000, 0.01)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    container.add(hitB);
    container.setScrollFactor(0, 0, true);

    const cleanup = () => {
      this.showingChoices = false;
      this.input.keyboard.off('keydown-A', onChooseA);
      this.input.keyboard.off('keydown-B', onChooseB);
      container.destroy();
    };

    const onChooseA = () => {
      cleanup();
      this.chapterManager.setCompanion(candidateKey);
      this.createFollowerCompanion(candidateKey);
      soundManager.playClueChime();
      this.startDialogue(candidateKey, 'accepted', () => {
        this.showQuestCompleteEffect(
          'COMPANION RECRUITED!',
          `You set out on the journey with ${candidateData.name}!\nHead east along the Steppe Road toward Semey.`,
          '+10 Heritage Points'
        );
        this.chapterManager.addPoints(10);
        this.updateAllUI();
      });
    };

    const onChooseB = () => {
      cleanup();
    };

    hitA.on('pointerdown', onChooseA);
    hitB.on('pointerdown', onChooseB);
    this.input.keyboard.once('keydown-A', onChooseA);
    this.input.keyboard.once('keydown-B', onChooseB);
  }

  triggerRoadAmbush() {
    this.player.setVelocity(0, 0);
    soundManager.playEncounterTension();
    const companion = this.chapterManager.companion;

    if (companion === 'sadyk') {
      this.startDialogue('antagonist_road', 'sadyk_betrayal', () => {
        this.showDefeatModal(
          'TRAGIC OUTCOME: BETRAYAL',
          'Sadyk turned out to be an accomplice of the steppe bandits!',
          'Sadyk had secretly conspired with the ambushers for a pouch of gold. In the narrow ravine you were overwhelmed, and the precious page bearing the names of the 12 copyists was seized...'
        );
      });
    } else if (companion === 'mukhamet') {
      this.startDialogue('antagonist_road', 'mukhamet_theft', () => {
        this.showDefeatModal(
          'TRAGIC OUTCOME: GREEDY SCRIBE',
          'Mukhamet stole the roster for an imperial rank and bounty!',
          'Mukhamet shot your horse, snatched the satchel of manuscripts, and handed the names of the 12 copyists to the tsarist authorities. Soon punitive detachments surrounded the village...'
        );
      });
    } else if (companion === 'raiymbek') {
      this.startDialogue('antagonist_road', 'raiymbek_heroic', () => {
        this.cameras.main.shake(600, 0.02);
        soundManager.playBattleClash();
        this.time.delayedCall(220, () => soundManager.playBattleClash());
        this.time.delayedCall(450, () => soundManager.playBattleClash());

        const antagonistNpc = this.npcs.find(n => n.dialogKey === 'antagonist_road');
        if (antagonistNpc) {
          this.tweens.add({
            targets: antagonistNpc,
            x: antagonistNpc.x + 100,
            y: antagonistNpc.y - 120,
            alpha: 0,
            duration: 900,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              if (typeof antagonistNpc.setNpcVisible === 'function') {
                antagonistNpc.setNpcVisible(false);
              } else {
                antagonistNpc.setVisible(false);
              }
            }
          });
        }
        this.ambushResolved = true;
        this.chapterManager.addPoints(10);
        this.showQuestCompleteEffect(
          'BATYR RAIYMBEK SHATTERED THE AMBUSH!',
          'Wielding his ancestral blade, Raiymbek routed the bandits in the ravine!\nThe road to the frontier post is clear.',
          '+10 Heritage Points'
        );
        this.updateAllUI();
      });
    } else if (companion === 'dauletbai') {
      this.startDialogue('antagonist_road', 'dauletbai_diplomatic', () => {
        soundManager.playCoins();
        this.time.delayedCall(200, () => soundManager.playCoins());
        this.time.delayedCall(400, () => soundManager.playCoins());

        const antagonistNpc = this.npcs.find(n => n.dialogKey === 'antagonist_road');
        if (antagonistNpc) {
          this.tweens.add({
            targets: antagonistNpc,
            x: antagonistNpc.x + 80,
            y: antagonistNpc.y + 120,
            alpha: 0,
            duration: 1000,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              if (typeof antagonistNpc.setNpcVisible === 'function') {
                antagonistNpc.setNpcVisible(false);
              } else {
                antagonistNpc.setVisible(false);
              }
            }
          });
        }
        this.ambushResolved = true;
        this.chapterManager.addPoints(10);
        this.showQuestCompleteEffect(
          'DAULET-BAI BRIBED THE AMBUSHERS!',
          'Gold coins settled the matter without shedding a single drop of blood!\nThe road to the frontier post is open.',
          '+10 Heritage Points'
        );
        this.updateAllUI();
      });
    }
  }

  showDefeatModal(title, subtitle, description) {
    this.showingChoices = true;
    if (this.player) this.player.setVelocity(0, 0);
    soundManager.playEncounterTension();
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const container = this.add.container(0, 0).setDepth(150).setScrollFactor(0);

    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x1a0505, 0.88)
      .setScrollFactor(0)
      .setInteractive();
    container.add(overlay);

    const panelW = 580, panelH = 330;
    const px = w / 2, py = h / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x250d0d, 0.98);
    bg.fillRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    bg.lineStyle(2, 0xC44040, 0.9);
    bg.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    container.add(bg);

    const skullIcon = this.add.text(px, py - panelH / 2 + 34, '⚔', {
      fontFamily: 'serif', fontSize: '26px', color: '#E05050'
    }).setOrigin(0.5);
    container.add(skullIcon);

    const titleTxt = this.add.text(px, py - panelH / 2 + 66, title, {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '17px', color: '#FF7070', letterSpacing: 2
    }).setOrigin(0.5);
    container.add(titleTxt);

    const subTxt = this.add.text(px, py - panelH / 2 + 94, subtitle, {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '13px', color: '#D4A0A0', fontStyle: 'italic'
    }).setOrigin(0.5);
    container.add(subTxt);

    const descTxt = this.add.text(px, py - 12, description, {
      fontFamily: 'Lora, Georgia, serif', fontSize: '13px', color: '#E8D5B0', align: 'center',
      wordWrap: { width: panelW - 60 }, lineSpacing: 4
    }).setOrigin(0.5);
    container.add(descTxt);

    const noteTxt = this.add.text(px, py + 56, 'The manuscript is lost. Your investigation must begin anew.', {
      fontFamily: 'Lora, Georgia, serif', fontSize: '12px', color: '#D4A0A0', fontStyle: 'italic'
    }).setOrigin(0.5);
    container.add(noteTxt);

    // TRY AGAIN button
    const btnW = 260, btnH = 46;
    const btnY = py + panelH / 2 - 42;

    const btnBg = this.add.graphics();
    const drawBtn = (hovered = false) => {
      btnBg.clear();
      btnBg.fillStyle(hovered ? 0x7A2828 : 0x5C2020, 0.95);
      btnBg.fillRoundedRect(px - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      btnBg.lineStyle(1.5, hovered ? 0xFF7070 : 0xC44040, 0.9);
      btnBg.strokeRoundedRect(px - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    };
    drawBtn(false);
    container.add(btnBg);

    const btnTxt = this.add.text(px, btnY, 'TRY AGAIN', {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '15px', color: '#FFE8C0', letterSpacing: 2
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    container.add(btnTxt);

    const hitArea = this.add.rectangle(px, btnY, btnW, btnH, 0x000000, 0.01)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    container.add(hitArea);
    container.setScrollFactor(0, 0, true);

    let retried = false;
    let readyForInput = false;
    const doRetry = () => {
      if (!readyForInput || retried) return;
      retried = true;
      this.showingChoices = false;
      this.input.keyboard.off('keydown-SPACE', doRetry);
      this.input.keyboard.off('keydown-ENTER', doRetry);
      soundManager.playPaperRustle();
      // Reset all campaign progress to zero and restart GameScene from Chapter 1
      this.chapterManager.reset();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(420, () => {
        this.scene.restart();
      });
    };

    hitArea.on('pointerover', () => {
      drawBtn(true);
      btnTxt.setColor('#FFFFFF');
    });

    hitArea.on('pointerout', () => {
      drawBtn(false);
      btnTxt.setColor('#FFE8C0');
    });

    // Delay input binding so the key/click that closed the last dialogue line cannot auto-dismiss the modal
    this.time.delayedCall(350, () => {
      readyForInput = true;
      hitArea.on('pointerdown', doRetry);
      btnTxt.on('pointerdown', doRetry);
      this.input.keyboard.once('keydown-SPACE', doRetry);
      this.input.keyboard.once('keydown-ENTER', doRetry);
    });
  }

  triggerCheckpointEncounter() {
    this.player.setVelocity(0, 0);
    const companion = this.chapterManager.companion;
    const dialogBranch = companion === 'dauletbai' ? 'dauletbai_pass' : 'raiymbek_pass';

    this.startDialogue('post_sentry', dialogBranch, () => {
      this.chapterManager.passCheckpoint();
      soundManager.playClueChime();
      if (this.checkpointBeam) {
        this.tweens.add({
          targets: this.checkpointBeam,
          angle: -75,
          duration: 1000,
          ease: 'Bounce.easeOut'
        });
      }
      this.chapterManager.addPoints(10);
      this.showQuestCompleteEffect(
        'FRONTIER POST PASSED!',
        'The barrier is raised. The city of Semey opens before you!\nProceed to the Alash Party Headquarters.',
        '+10 Heritage Points'
      );
      this.updateAllUI();
    });
  }

  triggerAlashArrival() {
    this.player.setVelocity(0, 0);
    this.startDialogue('alash_leader', 'arrival', () => {
      soundManager.playVictoryFanfare();
      this.chapterManager.completeChapter('ch6');
      const companionId = this.chapterManager.companion || 'raiymbek';
      this.chapterManager.setFinalChoice(companionId);

      let transitioned = false;
      const transitionToFinal = () => {
        if (transitioned) return;
        transitioned = true;

        const choiceObj = FINAL_CHOICES.find(c => c.id === companionId) || FINAL_CHOICES[0];
        const trustVal = typeof this.chapterManager.getAverageTrust === 'function' ? this.chapterManager.getAverageTrust() : 75;
        const trustLevel = trustVal >= 60 ? 'high' : 'low';
        const epilogueText = (EPILOGUES[choiceObj.id] && EPILOGUES[choiceObj.id][trustLevel]) ||
          'The manuscripts of the great Abai and the roster of 12 copyists were safely delivered to the Alash leaders in Semey.';
        const points = typeof this.chapterManager.getPoints === 'function' ? this.chapterManager.getPoints() : 100;
        const rank = typeof this.chapterManager.getRank === 'function' ? this.chapterManager.getRank() : 'HERITAGE KEEPER';

        this.scene.start('FinalScene', {
          points: points,
          rank: rank,
          ending: choiceObj,
          epilogueText: epilogueText,
          trust: trustVal,
        });
      };

      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', transitionToFinal);
      this.time.delayedCall(1100, transitionToFinal);
    });
  }

  // ==================== PRESENT EVIDENCE IN DIALOGUES ====================
  openPresentEvidenceMenu(npcKey) {
    if (!npcKey) return;
    const clues = this.chapterManager.getFoundEvidence();
    if (clues.length === 0) {
      this.showFloatingNotice('You have no collected evidence yet. Search the village first (TAB: Case File).');
      return;
    }

    this.showingEvidenceMenu = true;
    soundManager.playPaperRustle();
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.evidenceMenuContainer = this.add.container(0, 0).setDepth(110).setScrollFactor(0);
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.65)
      .setScrollFactor(0)
      .setInteractive();
    this.evidenceMenuContainer.add(overlay);

    const panelW = 600, panelH = 340, px = w / 2, py = h / 2;
    const bg = this.add.graphics();
    bg.fillStyle(0x2A1506, 0.98);
    bg.fillRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    bg.lineStyle(2, 0xC4A46C, 0.85);
    bg.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    this.evidenceMenuContainer.add(bg);

    const title = this.add.text(px, py - panelH / 2 + 22, '◆  PRESENT EVIDENCE  ◆', {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '15px', color: '#C4A46C', letterSpacing: 2
    }).setOrigin(0.5);
    this.evidenceMenuContainer.add(title);

    const subtitle = this.add.text(px, py - panelH / 2 + 42, `Interlocutor: ${this.getNpcDisplayName(npcKey)}`, {
      fontFamily: 'Lora, Georgia, serif', fontSize: '12px', color: '#D4C5A9', fontStyle: 'italic'
    }).setOrigin(0.5);
    this.evidenceMenuContainer.add(subtitle);

    const startY = py - 95;
    const cardW = 540, cardH = 38;
    this.evidenceKeyListeners = [];

    clues.slice(0, 5).forEach((clue, idx) => {
      const cy = startY + idx * 46;
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x3D2B1A, 0.95);
      cardBg.fillRoundedRect(px - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      cardBg.lineStyle(1, 0x8B7355, 0.6);
      cardBg.strokeRoundedRect(px - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      this.evidenceMenuContainer.add(cardBg);

      const isPresented = this.chapterManager.isCluePresented(npcKey, clue.id);
      const tag = isPresented ? ' [SHOWN]' : '';
      const cardTxt = this.add.text(px - cardW / 2 + 16, cy, `[${idx + 1}]  ${clue.name}${tag}`, {
        fontFamily: 'Cinzel, Georgia, serif', fontSize: '12.5px', color: isPresented ? '#A0896C' : '#FFE8C0'
      }).setOrigin(0, 0.5);
      this.evidenceMenuContainer.add(cardTxt);

      const hit = this.add.rectangle(px, cy, cardW, cardH, 0x000000, 0.01)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      this.evidenceMenuContainer.add(hit);

      const onSelect = () => this.handlePresentClue(npcKey, clue);
      hit.on('pointerover', () => {
        cardBg.clear();
        cardBg.fillStyle(0x5C3A1E, 0.98);
        cardBg.fillRoundedRect(px - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
        cardBg.lineStyle(1.5, 0xC4A46C, 0.9);
        cardBg.strokeRoundedRect(px - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      });
      hit.on('pointerout', () => {
        cardBg.clear();
        cardBg.fillStyle(0x3D2B1A, 0.95);
        cardBg.fillRoundedRect(px - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
        cardBg.lineStyle(1, 0x8B7355, 0.6);
        cardBg.strokeRoundedRect(px - cardW / 2, cy - cardH / 2, cardW, cardH, 6);
      });
      hit.on('pointerdown', onSelect);

      const numKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE + idx);
      numKey.once('down', onSelect);
      this.evidenceKeyListeners.push({ key: numKey, fn: onSelect });
    });

    const closeBtn = this.add.text(px, py + panelH / 2 - 24, '[ CLOSE (ESC) ]', {
      fontFamily: 'Cinzel, Georgia, serif', fontSize: '12px', color: '#C4A46C', letterSpacing: 1
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    this.evidenceMenuContainer.add(closeBtn);
    this.evidenceMenuContainer.setScrollFactor(0, 0, true);

    const onClose = () => this.closeEvidenceMenu();
    closeBtn.on('pointerdown', onClose);
    overlay.on('pointerdown', onClose);
  }

  closeEvidenceMenu() {
    if (this.evidenceKeyListeners) {
      this.evidenceKeyListeners.forEach(({ key, fn }) => key.off('down', fn));
      this.evidenceKeyListeners = [];
    }
    if (this.evidenceMenuContainer) {
      this.evidenceMenuContainer.destroy();
      this.evidenceMenuContainer = null;
    }
    this.showingEvidenceMenu = false;
  }

  handlePresentClue(npcKey, clue) {
    this.closeEvidenceMenu();
    soundManager.playPaperRustle();
    const reactions = DIALOGUE.reactions && DIALOGUE.reactions[npcKey];
    const reactionText = (reactions && reactions[clue.id]) || (reactions && reactions.default) || 'An interesting item, though I have nothing more to add about it.';

    const isNew = this.chapterManager.markCluePresented(npcKey, clue.id);
    if (isNew && reactions && reactions[clue.id]) {
      this.chapterManager.addPoints(5);
      this.chapterManager.adjustTrust(npcKey, 5);
      soundManager.playClueChime();
      this.showFloatingNotice('+5 Heritage Points (New testimony unlocked!)');
      this.updateAllUI();
    }

    this.startDialogueData([
      { speaker: 'Investigator', text: `Take a look at this clue: "${clue.name}". What do you know about it?` },
      { speaker: this.getNpcDisplayName(npcKey), text: reactionText }
    ]);
  }

  getNpcDisplayName(key) {
    const map = {
      elder: 'Village Elder',
      teacher: 'Teacher',
      archivist: 'Archivist',
      sadyk: 'Sadyk (Guide)',
      mukhamet: 'Mukhamet (Scribe)',
      raiymbek: 'Raiymbek (Blacksmith)',
      dauletbai: 'Daulet-bai (Merchant)',
      antagonist_road: 'Ambush Leader',
      post_sentry: 'Frontier Officer',
      alash_leader: 'Alikhan Bokeikhanov'
    };
    return map[key] || key.toUpperCase();
  }
}