import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x1a0a00);

    const title = this.add.text(w / 2, h / 2 - 60, 'HISTORY OF KAZAKHSTAN', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '26px',
      color: '#C4A46C',
      letterSpacing: 6,
    }).setOrigin(0.5);

    const subtitle = this.add.text(w / 2, h / 2 - 10, 'Loading historical chronicles...', {
      fontFamily: 'Lora, Georgia, serif',
      fontSize: '14px',
      color: '#A0896C',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    const barW = 280;
    const barH = 6;
    const barX = (w - barW) / 2;
    const barY = h / 2 + 30;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x2A1506);
    barBg.fillRoundedRect(barX, barY, barW, barH, 3);
    barBg.lineStyle(1, 0x5C3A1E);
    barBg.strokeRoundedRect(barX, barY, barW, barH, 3);

    const barFill = this.add.graphics();
    const ornament = this.add.graphics();
    this.drawLoadingOrnament(ornament, w, h);

    this.load.on('progress', (val) => {
      barFill.clear();
      barFill.fillStyle(0xC4A46C);
      barFill.fillRoundedRect(barX + 1, barY + 1, (barW - 2) * val, barH - 2, 2);
    });
  }

  drawLoadingOrnament(g, w, h) {
    g.lineStyle(1, 0xC4A46C, 0.12);
    const m = 60;
    for (let x = m; x < w - m; x += 80) {
      const y1 = h / 2 - 40;
      const y2 = h / 2 + 60;
      g.fillStyle(0xC4A46C, 0.06);
      g.fillCircle(x, y1, 2);
      g.fillCircle(x, y2, 2);
    }
  }

  create() {
    this.generateTextures();
    this.time.delayedCall(500, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  generateTextures() {
    this.createPlayerTexture();
    this.createNPCTextures();
    this.createFragmentTexture();
    this.createParticleTexture();
    this.createTreeTexture();
    this.createShadowTexture();
    this.createGlowTexture();
    this.createOrnamentTexture();
    this.createParchmentTexture();
  }

  createPlayerTexture() {
    const size = 48;
    const g = this.make.graphics({ add: false });

    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(size / 2, size - 4, 28, 10);

    // Body / robe (dark brown chapan)
    g.fillStyle(0x5C3A1E);
    g.fillRoundedRect(12, 16, 24, 26, 6);

    // Robe opening
    g.fillStyle(0x4A2A10);
    g.fillRect(20, 18, 8, 24);

    // Lighter inner
    g.fillStyle(0x8B7355);
    g.fillRect(22, 18, 4, 22);

    // Arms
    g.fillStyle(0x5C3A1E);
    g.fillRoundedRect(8, 18, 8, 14, 3);
    g.fillRoundedRect(32, 18, 8, 14, 3);

    // Head
    g.fillStyle(0xD4A574);
    g.fillCircle(24, 11, 7);

    // Hat (taqiya-style)
    g.fillStyle(0x3D2B1A);
    g.fillRoundedRect(18, 3, 12, 8, { tl: 5, tr: 5, bl: 0, br: 0 });

    // Hat band
    g.fillStyle(0xC4A46C, 0.6);
    g.fillRect(18, 8, 12, 2);

    // Satchel strap
    g.lineStyle(1.5, 0x4A3520);
    g.lineBetween(12, 16, 18, 34);

    // Satchel
    g.fillStyle(0x6B5335);
    g.fillRoundedRect(14, 30, 10, 8, 3);
    g.fillStyle(0x8B7355);
    g.fillRoundedRect(15, 31, 8, 6, 2);

    // Eyes
    g.fillStyle(0x1a0a00);
    g.fillCircle(22, 10, 1);
    g.fillCircle(26, 10, 1);

    // Legs / boots
    g.fillStyle(0x2A1506);
    g.fillRect(16, 40, 6, 6);
    g.fillRect(26, 40, 6, 6);

    g.generateTexture('player', size, size);
    g.destroy();
  }

  createNPCTextures() {
    this.createElderTexture();
    this.createTeacherTexture();
    this.createArchivistTexture();
    this.createSadykTexture();
    this.createMukhametTexture();
    this.createRaiymbekTexture();
    this.createDauletbaiTexture();
    this.createAntagonistTexture();
    this.createAlashLeaderTexture();
    this.createCheckpointTexture();
    this.createAlashBannerTexture();
  }

  createElderTexture() {
    const size = 48;
    const g = this.make.graphics({ add: false });

    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(size / 2, size - 4, 28, 10);

    // Body (gray-white robes)
    g.fillStyle(0x9B9490);
    g.fillRoundedRect(10, 14, 28, 28, 7);

    // Robe fold
    g.fillStyle(0x85807C);
    g.fillRect(18, 16, 12, 26);

    // Arms
    g.fillStyle(0x9B9490);
    g.fillRoundedRect(6, 16, 10, 16, 3);
    g.fillRoundedRect(32, 16, 10, 16, 3);

    // Head (older, lighter hair)
    g.fillStyle(0xE0C8A8);
    g.fillCircle(24, 9, 8);

    // White beard
    g.fillStyle(0xD0D0D0);
    g.fillRoundedRect(19, 12, 10, 6, 3);

    // Traditional hat (kalpak-style, taller)
    g.fillStyle(0xC4C0BC);
    g.fillRoundedRect(17, 0, 14, 11, { tl: 6, tr: 6, bl: 0, br: 0 });
    g.fillStyle(0xC4A46C, 0.5);
    g.fillRect(17, 8, 14, 2);

    // Walking stick
    g.lineStyle(1.5, 0x6B5335);
    g.lineBetween(36, 20, 42, 42);

    // Kind eyes
    g.fillStyle(0x2A1506);
    g.fillCircle(21, 8, 1.2);
    g.fillCircle(27, 8, 1.2);

    // Boots
    g.fillStyle(0x3D2B1A);
    g.fillRect(14, 40, 8, 6);
    g.fillRect(26, 40, 8, 6);

    g.generateTexture('npc_elder', size, size);
    g.destroy();
  }

  createTeacherTexture() {
    const size = 48;
    const g = this.make.graphics({ add: false });

    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(size / 2, size - 4, 28, 10);

    // Body (blue-tinted dark coat)
    g.fillStyle(0x3A4A5C);
    g.fillRoundedRect(11, 15, 26, 27, 7);

    // Vest / inner
    g.fillStyle(0x4A5E72);
    g.fillRect(19, 17, 10, 25);

    // Arms
    g.fillStyle(0x3A4A5C);
    g.fillRoundedRect(7, 17, 10, 16, 3);
    g.fillRoundedRect(31, 17, 10, 16, 3);

    // Head
    g.fillStyle(0xD4A574);
    g.fillCircle(24, 10, 7.5);

    // Glasses
    g.lineStyle(1, 0x8B7355);
    g.strokeCircle(21, 9, 3.5);
    g.strokeCircle(27, 9, 3.5);
    g.lineBetween(24.5, 9, 24.5, 9);

    // Hat (flat cap)
    g.fillStyle(0x2A3540);
    g.fillRoundedRect(17, 2, 14, 8, { tl: 4, tr: 4, bl: 0, br: 0 });
    g.fillStyle(0x3D4E60, 0.5);
    g.fillRect(17, 7, 14, 2);

    // Book under arm
    g.fillStyle(0x6B5335);
    g.fillRect(32, 24, 10, 8);
    g.fillStyle(0x8B7355);
    g.fillRect(33, 25, 8, 6);
    g.lineStyle(0.5, 0xC4A46C, 0.4);
    g.lineBetween(32, 28, 42, 28);

    // Eyes
    g.fillStyle(0x1a0a00);
    g.fillCircle(21, 9, 1);
    g.fillCircle(27, 9, 1);

    // Boots
    g.fillStyle(0x2A1506);
    g.fillRect(15, 40, 7, 6);
    g.fillRect(26, 40, 7, 6);

    g.generateTexture('npc_teacher', size, size);
    g.destroy();
  }

  createArchivistTexture() {
    const size = 48;
    const g = this.make.graphics({ add: false });

    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(size / 2, size - 4, 28, 10);

    // Body (warm brown formal vest)
    g.fillStyle(0x6B5335);
    g.fillRoundedRect(11, 14, 26, 28, 7);

    // Vest details
    g.fillStyle(0x7A6345);
    g.fillRect(19, 16, 10, 26);

    // Arms
    g.fillStyle(0x6B5335);
    g.fillRoundedRect(7, 16, 10, 16, 3);
    g.fillRoundedRect(31, 16, 10, 16, 3);

    // Head
    g.fillStyle(0xC4A070);
    g.fillCircle(24, 9, 7.5);

    // Spectacles
    g.lineStyle(1, 0xC4A46C);
    g.strokeCircle(21, 8, 3);
    g.strokeCircle(27, 8, 3);
    g.lineBetween(24, 8, 24, 8);

    // Formal hat
    g.fillStyle(0x3D2B1A);
    g.fillRoundedRect(16, 1, 16, 9, { tl: 5, tr: 5, bl: 0, br: 0 });
    g.fillStyle(0xC4A46C, 0.4);
    g.fillRect(16, 7, 16, 2);

    // Scroll in hand
    g.fillStyle(0xE8D5B0);
    g.fillRect(33, 22, 10, 4);
    g.fillStyle(0xD4C5A9);
    g.fillRect(34, 23, 8, 2);

    // Eyes
    g.fillStyle(0x1a0a00);
    g.fillCircle(21, 8, 1);
    g.fillCircle(27, 8, 1);

    // Boots
    g.fillStyle(0x2A1506);
    g.fillRect(15, 40, 7, 6);
    g.fillRect(26, 40, 7, 6);

    // Small key on belt
    g.fillStyle(0xC4A46C);
    g.fillCircle(24, 34, 1.5);

    g.generateTexture('npc_archivist', size, size);
    g.destroy();
  }

  createSadykTexture() {
    const size = 48;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(size / 2, size - 4, 28, 10);
    // Body (herdsman teal-greenish tunic)
    g.fillStyle(0x2E5B54);
    g.fillRoundedRect(11, 14, 26, 28, 6);
    g.fillStyle(0x407A70);
    g.fillRect(19, 16, 10, 26);
    // Arms
    g.fillStyle(0x2E5B54);
    g.fillRoundedRect(7, 16, 10, 16, 3);
    g.fillRoundedRect(31, 16, 10, 16, 3);
    // Head & face
    g.fillStyle(0xC89E70);
    g.fillCircle(24, 9, 7.5);
    // Fox/wolf fur hat (Tymak)
    g.fillStyle(0x9E5B32);
    g.fillRoundedRect(15, 0, 18, 10, { tl: 7, tr: 7, bl: 2, br: 2 });
    g.fillStyle(0xD48B55);
    g.fillCircle(24, 1, 3);
    // Whip (qamshy) in hand
    g.lineStyle(1.5, 0x4A2A15);
    g.lineBetween(36, 24, 43, 38);
    // Eyes (cunning glance)
    g.fillStyle(0x1a0a00);
    g.fillCircle(22, 9, 1);
    g.fillCircle(26, 9, 1);
    // Boots
    g.fillStyle(0x2A1506);
    g.fillRect(15, 40, 7, 6);
    g.fillRect(26, 40, 7, 6);
    g.generateTexture('npc_sadyk', size, size);
    g.destroy();
  }

  createMukhametTexture() {
    const size = 48;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(size / 2, size - 4, 28, 10);
    // Body (dark urban bureaucrat coat)
    g.fillStyle(0x2F3542);
    g.fillRoundedRect(11, 14, 26, 28, 6);
    g.fillStyle(0x57606F);
    g.fillRect(20, 16, 8, 26);
    // Arms
    g.fillStyle(0x2F3542);
    g.fillRoundedRect(7, 16, 10, 16, 3);
    g.fillRoundedRect(31, 16, 10, 16, 3);
    // Head
    g.fillStyle(0xD8B28A);
    g.fillCircle(24, 9, 7.5);
    // Small dark hat / visor cap
    g.fillStyle(0x1E272E);
    g.fillRoundedRect(16, 2, 16, 8, { tl: 4, tr: 4, bl: 0, br: 0 });
    g.fillStyle(0xC4A46C, 0.6);
    g.fillRect(16, 7, 16, 1.5);
    // Glasses
    g.lineStyle(1, 0xC4A46C);
    g.strokeCircle(21, 9, 2.5);
    g.strokeCircle(27, 9, 2.5);
    g.lineBetween(23.5, 9, 24.5, 9);
    // Ledger under arm
    g.fillStyle(0x8B1E1E);
    g.fillRect(6, 26, 8, 10);
    // Boots
    g.fillStyle(0x1E272E);
    g.fillRect(15, 40, 7, 6);
    g.fillRect(26, 40, 7, 6);
    g.generateTexture('npc_mukhamet', size, size);
    g.destroy();
  }

  createRaiymbekTexture() {
    const size = 48;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(size / 2, size - 4, 28, 10);
    // Broad muscular body with leather smith apron
    g.fillStyle(0x7D3C1B);
    g.fillRoundedRect(9, 13, 30, 29, 7);
    g.fillStyle(0x4A2511);
    g.fillRect(17, 15, 14, 27);
    // Strong bare muscular arms with iron bracers
    g.fillStyle(0xC48C60);
    g.fillRoundedRect(5, 15, 11, 17, 4);
    g.fillRoundedRect(32, 15, 11, 17, 4);
    g.fillStyle(0x2A2A2A);
    g.fillRect(5, 25, 11, 4);
    g.fillRect(32, 25, 11, 4);
    // Head with resolute expression
    g.fillStyle(0xC48C60);
    g.fillCircle(24, 9, 8);
    // Red warrior headband / Taqiya with batyr crescent
    g.fillStyle(0x9E1B1B);
    g.fillRoundedRect(16, 2, 16, 8, { tl: 5, tr: 5, bl: 0, br: 0 });
    g.fillStyle(0xFFD700);
    g.fillCircle(24, 6, 2);
    // Hammer / Ancestral saber hilt on back
    g.fillStyle(0x555555);
    g.fillRect(36, 12, 6, 18);
    g.fillStyle(0x9E1B1B);
    g.fillRect(35, 10, 8, 4);
    // Fierce eyes & mustache
    g.fillStyle(0x1a0a00);
    g.fillCircle(21, 9, 1.2);
    g.fillCircle(27, 9, 1.2);
    g.fillRect(19, 13, 10, 2);
    // Heavy boots
    g.fillStyle(0x2A1506);
    g.fillRect(14, 40, 8, 6);
    g.fillRect(26, 40, 8, 6);
    g.generateTexture('npc_raiymbek', size, size);
    g.destroy();
  }

  createDauletbaiTexture() {
    const size = 48;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(size / 2, size - 4, 28, 10);
    // Wealthy wide velvet robe (crimson with gold embroidery)
    g.fillStyle(0x8B152B);
    g.fillRoundedRect(8, 13, 32, 29, 8);
    g.fillStyle(0xDAA520);
    g.fillRect(18, 14, 12, 28);
    g.fillStyle(0xFFFFFF);
    g.fillRoundedRect(15, 14, 18, 5, 2); // Astrakhan fur collar
    // Wide arms in velvet
    g.fillStyle(0x8B152B);
    g.fillRoundedRect(4, 15, 12, 16, 4);
    g.fillRoundedRect(32, 15, 12, 16, 4);
    // Head (jovial dignified merchant)
    g.fillStyle(0xD4A070);
    g.fillCircle(24, 8, 8);
    // Opulent tall Borik hat trimmed with sable fur
    g.fillStyle(0x8B152B);
    g.fillRoundedRect(16, 0, 16, 9, { tl: 6, tr: 6, bl: 0, br: 0 });
    g.fillStyle(0x3D2415);
    g.fillRect(15, 6, 18, 4);
    g.fillStyle(0xFFD700);
    g.fillCircle(24, 1, 2.5);
    // Silver coin pouch at belt
    g.fillStyle(0xC0C0C0);
    g.fillCircle(28, 30, 4);
    g.lineStyle(1, 0xFFD700);
    g.strokeCircle(28, 30, 4);
    // Boots with embroidery
    g.fillStyle(0x2A1506);
    g.fillRect(14, 40, 8, 6);
    g.fillRect(26, 40, 8, 6);
    g.generateTexture('npc_dauletbai', size, size);
    g.destroy();
  }

  createAntagonistTexture() {
    const size = 48;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(size / 2, size - 4, 28, 10);
    // Dark ominous steppe cape
    g.fillStyle(0x1F1F24);
    g.fillRoundedRect(9, 13, 30, 29, 7);
    g.fillStyle(0x2E1C18);
    g.fillRect(18, 15, 12, 27);
    // Armed arms with weapon
    g.fillStyle(0x1F1F24);
    g.fillRoundedRect(5, 15, 11, 16, 3);
    g.fillRoundedRect(32, 15, 11, 16, 3);
    // Steel saber in hand
    g.lineStyle(2, 0xC0C0C0);
    g.lineBetween(36, 26, 44, 40);
    g.fillStyle(0xDAA520);
    g.fillCircle(36, 25, 2.5);
    // Masked face / dark eyes
    g.fillStyle(0xC09068);
    g.fillCircle(24, 9, 7.5);
    g.fillStyle(0x111115);
    g.fillRect(17, 10, 14, 5); // Scarf / mask
    // Dark fur papakha
    g.fillStyle(0x151515);
    g.fillRoundedRect(16, 1, 16, 9, { tl: 5, tr: 5, bl: 0, br: 0 });
    // Eyes looking sharp
    g.fillStyle(0xFFE8C0);
    g.fillCircle(21, 8, 1.2);
    g.fillCircle(27, 8, 1.2);
    // Heavy boots
    g.fillStyle(0x0A0A0A);
    g.fillRect(14, 40, 8, 6);
    g.fillRect(26, 40, 8, 6);
    g.generateTexture('npc_antagonist', size, size);
    g.destroy();
  }

  createAlashLeaderTexture() {
    const size = 48;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(size / 2, size - 4, 28, 10);
    // Noble black European intellectual suit with tie and wool overcoat
    g.fillStyle(0x1A1E24);
    g.fillRoundedRect(10, 13, 28, 29, 6);
    g.fillStyle(0xFFFFFF);
    g.fillTriangle(20, 14, 28, 14, 24, 24); // white shirt collar
    g.fillStyle(0x8B1A1A);
    g.fillRect(23, 17, 2, 7); // crimson tie
    // Arms
    g.fillStyle(0x1A1E24);
    g.fillRoundedRect(6, 15, 10, 16, 3);
    g.fillRoundedRect(32, 15, 10, 16, 3);
    // Dignified head
    g.fillStyle(0xE0C0A0);
    g.fillCircle(24, 8, 7.5);
    // Famous Alash Astrakhan karakul papakha hat
    g.fillStyle(0x222226);
    g.fillRoundedRect(16, 0, 16, 9, { tl: 6, tr: 6, bl: 0, br: 0 });
    // Intellectual glasses & mustache
    g.lineStyle(1, 0xFFD700);
    g.strokeCircle(21, 7.5, 2.5);
    g.strokeCircle(27, 7.5, 2.5);
    g.lineBetween(23.5, 7.5, 24.5, 7.5);
    g.fillStyle(0x2A1506);
    g.fillRect(20, 11, 8, 2); // neat mustache
    // Roll of official Alash newspaper / declaration in hand
    g.fillStyle(0xFFF8DC);
    g.fillRect(34, 25, 9, 5);
    // Polished shoes
    g.fillStyle(0x0F0F12);
    g.fillRect(15, 40, 7, 6);
    g.fillRect(26, 40, 7, 6);
    g.generateTexture('npc_alash_leader', size, size);
    g.destroy();
  }

  createCheckpointTexture() {
    const size = 64;
    const g = this.make.graphics({ add: false });
    // Checkpoint post pillar
    g.fillStyle(0x4A3520);
    g.fillRect(4, 8, 10, 52);
    g.fillStyle(0x5C3A1E);
    g.fillRect(2, 6, 14, 6);
    // Red and white striped barrier beam
    for (let x = 14; x < 62; x += 12) {
      g.fillStyle(0xB82626);
      g.fillRect(x, 18, 6, 6);
      g.fillStyle(0xF0F0F0);
      g.fillRect(x + 6, 18, 6, 6);
    }
    // Lantern on post
    g.fillStyle(0xFFD700);
    g.fillCircle(9, 4, 3);
    g.generateTexture('barrier_post', size, size);
    g.destroy();
  }

  createAlashBannerTexture() {
    const w = 48, h = 32;
    const g = this.make.graphics({ add: false });
    // Turquoise blue flag of freedom and sky
    g.fillStyle(0x00A896);
    g.fillRect(0, 0, w, h);
    g.lineStyle(1.5, 0xC4A46C);
    g.strokeRect(1, 1, w - 2, h - 2);
    // Golden star and crescent
    g.fillStyle(0xFFD700);
    g.fillCircle(w / 2 - 4, h / 2, 8);
    g.fillStyle(0x00A896);
    g.fillCircle(w / 2 - 2, h / 2, 7);
    g.fillStyle(0xFFD700);
    g.fillCircle(w / 2 + 7, h / 2, 3);
    g.generateTexture('alash_banner', w, h);
    g.destroy();
  }

  createFragmentTexture() {
    const size = 36;
    const g = this.make.graphics({ add: false });

    // Parchment base
    g.fillStyle(0xE8D5B0);
    g.fillRoundedRect(4, 2, 28, 32, 4);

    // Aged edges
    g.fillStyle(0xD4C5A0, 0.5);
    g.fillRoundedRect(5, 3, 26, 4, 2);
    g.fillStyle(0xC8B890, 0.4);
    g.fillRoundedRect(5, 27, 26, 6, 2);

    // Fold lines
    g.lineStyle(0.5, 0xC4A46C, 0.3);
    g.lineBetween(10, 10, 28, 10);
    g.lineBetween(10, 20, 30, 20);

    // Text lines (simulated)
    g.lineStyle(0.8, 0xB0A080, 0.4);
    for (let y = 7; y < 25; y += 5) {
      g.lineBetween(8, y, 18, y);
    }
    for (let y = 7; y < 26; y += 5) {
      g.lineBetween(20, y, 28, y);
    }

    // Border
    g.lineStyle(1, 0xC4A46C, 0.7);
    g.strokeRoundedRect(4, 2, 28, 32, 4);

    // Ornament mark at top
    g.fillStyle(0xC4A46C, 0.5);
    g.fillCircle(18, 6, 2);

    // Torn edge effect
    g.fillStyle(0xE8D5B0, 0.3);
    g.fillTriangle(4, 18, 0, 14, 0, 22);
    g.fillTriangle(32, 12, 36, 8, 36, 16);

    g.generateTexture('fragment', size, size);
    g.destroy();
  }

  createParticleTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xFFFFFF);
    g.fillCircle(3, 3, 3);
    g.generateTexture('particle', 6, 6);
    g.destroy();
  }

  createTreeTexture() {
    const size = 52;
    const g = this.make.graphics({ add: false });

    // Shadow
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(size / 2, size - 2, 34, 10);

    // Trunk
    g.fillStyle(0x5C3A1E);
    g.fillRoundedRect(20, 24, 12, 26, 2);

    // Trunk texture
    g.fillStyle(0x4A2A10, 0.4);
    g.fillRect(24, 26, 2, 22);

    // Main canopy
    g.fillStyle(0x3D6B2E);
    g.fillCircle(26, 19, 16);
    g.fillStyle(0x4A8238);
    g.fillCircle(22, 17, 13);
    g.fillCircle(30, 18, 13);

    // Highlight layer
    g.fillStyle(0x5A9840, 0.5);
    g.fillCircle(24, 14, 9);
    g.fillCircle(30, 16, 8);

    // Darker depth
    g.fillStyle(0x2D5220, 0.4);
    g.fillCircle(20, 22, 8);

    g.generateTexture('tree', size, size);
    g.destroy();
  }

  createShadowTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(20, 8, 36, 14);
    g.generateTexture('shadow', 40, 16);
    g.destroy();
  }

  createGlowTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xC4A46C, 0.3);
    g.fillCircle(20, 20, 20);
    g.fillStyle(0xC4A46C, 0.15);
    g.fillCircle(20, 20, 28);
    g.fillStyle(0xFFE8C0, 0.08);
    g.fillCircle(20, 20, 36);
    g.generateTexture('glow', 40, 40);
    g.destroy();
  }

  createOrnamentTexture() {
    const size = 28;
    const g = this.make.graphics({ add: false });

    // Diamond shape with inner detail - Kazakh ornament style
    g.fillStyle(0xC4A46C, 0.3);
    g.fillTriangle(size / 2, 2, 2, size / 2, size / 2, size - 2);
    g.fillTriangle(size / 2, 2, size - 2, size / 2, size / 2, size - 2);

    g.lineStyle(1, 0xC4A46C, 0.5);
    g.strokeTriangle(size / 2, 2, 2, size / 2, size / 2, size - 2);
    g.strokeTriangle(size / 2, 2, size - 2, size / 2, size / 2, size - 2);

    g.fillStyle(0xFFE8C0, 0.3);
    g.fillCircle(size / 2, size / 2, 3);

    g.generateTexture('ornament', size, size);
    g.destroy();
  }

  createParchmentTexture() {
    const size = 8;
    const g = this.make.graphics({ add: false });

    // Simple noise-like texture for parchment feel
    g.fillStyle(0xE8D5B0, 0.5);
    g.fillRect(0, 0, size, size);
    g.fillStyle(0xD4C5A9, 0.3);
    g.fillRect(0, 0, 2, 2);
    g.fillRect(4, 4, 2, 2);
    g.fillStyle(0xF0E0C0, 0.2);
    g.fillRect(2, 2, 2, 2);
    g.fillRect(6, 0, 2, 2);

    g.generateTexture('parchment_tile', size, size);
    g.destroy();
  }
}