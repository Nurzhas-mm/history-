import Phaser from 'phaser';
import soundManager from '../systems/SoundManager.js';
import {
  ECO_SAVE_KEY, ECO_MAP, HOTSPOTS, ECO_BUILDINGS, ECO_INTRO, ERAS, ECO_EVIDENCE, ECO_OBJECTS,
  SHELTERS, CLOUD_ERAS, ECO_MISSIONS, ERA_INSIGHTS,
} from '../data/ecoData.js';

const FONT_H = 'Cinzel, Georgia, serif';
const FONT_B = 'Lora, Georgia, serif';
const EVIDENCE_PER_ERA = 3;
const SHELTER_R = 90;
const RADAR_RANGE = 800;
const STAT_NAMES = { aral: 'Aral Sea', health: 'Public Health', awareness: 'Public Voice' };

export default class EcoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EcoScene' });
  }

  init(data) {
    this.newGame = !!(data && data.newGame);
  }

  create() {
    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.W = ECO_MAP.width;
    this.H = ECO_MAP.height;
    this.westBorderX = ECO_MAP.westBorderX || 1250;
    this.eastBorderX = ECO_MAP.eastBorderX || 2350;

    // Audio initialization — wind plays ONLY inside gameplay scenes and stops on shutdown
    soundManager.init();
    soundManager.startWindAmbient();
    const startWindIfActive = () => {
      if (this.scene && this.scene.isActive('EcoScene')) {
        soundManager.startWindAmbient();
      }
    };
    this.input.once('pointerdown', startWindIfActive);
    this.input.keyboard.once('keydown', startWindIfActive);

    this.mode = 'play'; // play | dialogue | modal | card | transition
    this.dialogue = null;
    this.modal = null;
    this.modalKey = null;
    this.cardAdvance = null;
    this.geigerTimer = 0;
    this.stepTimer = 0;
    this.borderNoticeCooldown = 0;
    this.notice = null;
    this.ships = [];
    this.interactables = [];

    // Radiation / suit / radar / missions runtime state
    this.dose = 0;
    this.suitHP = 100;
    this.inShelter = false;
    this.cloud = { phase: 'idle', timer: 0, x: 0, maxX: 0, halfW: 170 };
    this.radarOn = true;
    this.radarTimer = 0;
    this.radarPulse = 0;
    this.geigerTimer = 0;
    this.hudTimer = 0;
    this.doseWarnCooldown = 0;
    this.carrying = null;
    this.carryIcon = null;
    this.escort = null;
    this.missionRt = {};
    this.introSeen = {};

    this.loadState();
    this.ensureTextures();

    this.physics.world.setBounds(0, 0, this.W, this.H);
    this.cameras.main.setBounds(0, 0, this.W, this.H);
    this.obstacles = this.physics.add.staticGroup();

    this.worldGfx = this.add.graphics().setDepth(0);
    this.hazeGfx = this.add.graphics().setDepth(2);
    this.cloudGfx = this.add.graphics().setDepth(3);
    this.checkpointGfx = this.add.graphics().setDepth(6);

    this.createZoneLabels();
    this.createBuildingsAndLandmarks();
    this.createDecor();
    this.createCheckpointsUI();
    this.createInteractables();
    this.createMissions();
    this.createPlayer();
    this.createUI();
    this.setupInput();

    this.resetCloud();
    this.redrawWorld();
    this.refreshAll();

    this.showEraIntro(this.state.era, this.isFreshRun);
  }

  // ==================== STATE ====================
  freshState() {
    return { era: 0, found: [], stats: { aral: 0, health: 0, awareness: 0 }, choices: [], suit: false, missions: {} };
  }

  loadState() {
    this.state = this.freshState();
    this.isFreshRun = true;
    if (this.newGame) {
      try { localStorage.removeItem(ECO_SAVE_KEY); } catch (e) {}
      return;
    }
    try {
      const raw = localStorage.getItem(ECO_SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.era !== 'number' || data.era < 0 || data.era >= ERAS.length) return;
      this.state = {
        era: data.era,
        found: Array.isArray(data.found) ? data.found : [],
        stats: Object.assign({ aral: 0, health: 0, awareness: 0 }, data.stats || {}),
        choices: Array.isArray(data.choices) ? data.choices : [],
        suit: !!data.suit,
        missions: (data.missions && typeof data.missions === 'object') ? data.missions : {},
      };
      this.isFreshRun = false;
    } catch (e) {
      this.state = this.freshState();
    }
  }

  saveState() {
    try { localStorage.setItem(ECO_SAVE_KEY, JSON.stringify(this.state)); } catch (e) {}
  }

  evidenceCount() {
    return ECO_EVIDENCE.filter(e => e.era === this.state.era && this.state.found.includes(e.id)).length;
  }

  // ==================== TEXTURES ====================
  ensureTextures() {
    const make = (key, w, h, fn) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ add: false });
      fn(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    const trefoil = (g, cx, cy, r) => {
      g.fillStyle(0xF0C020, 1);
      g.fillCircle(cx, cy, r);
      g.lineStyle(3, 0x111111, 1);
      g.strokeCircle(cx, cy, r);
      g.fillStyle(0x111111, 1);
      [-90, 30, 150].forEach(a => {
        const a1 = Phaser.Math.DegToRad(a - 30);
        const a2 = Phaser.Math.DegToRad(a + 30);
        const rr = r * 0.78;
        g.fillTriangle(cx, cy, cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr, cx + Math.cos(a2) * rr, cy + Math.sin(a2) * rr);
      });
      g.fillStyle(0xF0C020, 1);
      g.fillCircle(cx, cy, r * 0.22);
      g.fillStyle(0x111111, 1);
      g.fillCircle(cx, cy, r * 0.14);
    };

    make('eco_player', 48, 48, g => {
      g.fillStyle(0x000000, 0.25); g.fillEllipse(24, 44, 28, 10);
      g.fillStyle(0xE8E2C8, 1); g.fillRoundedRect(13, 18, 22, 24, 6);
      g.fillStyle(0xB8B090, 1); g.fillRect(22, 20, 4, 22);
      g.fillStyle(0xD8A020, 1); g.fillRect(14, 29, 20, 3);
      g.fillStyle(0xE8C8A0, 1); g.fillCircle(24, 13, 9);
      g.fillStyle(0x4A5A3A, 1); g.fillRoundedRect(14, 3, 20, 9, 4);
      g.fillStyle(0x203040, 1); g.fillRoundedRect(17, 10, 14, 7, 3);
      g.fillStyle(0x333333, 1); g.fillRect(14, 41, 8, 4); g.fillRect(26, 41, 8, 4);
    });

    make('eco_npc', 48, 48, g => {
      g.fillStyle(0x000000, 0.25); g.fillEllipse(24, 44, 28, 10);
      g.fillStyle(0xFFFFFF, 1); g.fillRoundedRect(13, 18, 22, 24, 6);
      g.fillStyle(0xDDDDDD, 1); g.fillRect(22, 20, 4, 22);
      g.fillStyle(0xF4D8B8, 1); g.fillCircle(24, 13, 8);
      g.fillStyle(0x6A6A6A, 1); g.fillRoundedRect(16, 3, 16, 7, 3);
      g.fillStyle(0x444444, 1); g.fillRect(14, 41, 8, 4); g.fillRect(26, 41, 8, 4);
    });

    make('eco_tower', 56, 72, g => {
      g.lineStyle(3, 0x5A4A38, 1);
      g.lineBetween(10, 70, 22, 22); g.lineBetween(46, 70, 34, 22);
      g.lineBetween(14, 52, 42, 40); g.lineBetween(42, 52, 14, 40);
      g.fillStyle(0x8A7A66, 1); g.fillRect(14, 14, 28, 10);
      g.fillStyle(0xE0D8C0, 1); g.fillRect(22, 5, 12, 9);
      g.lineStyle(2, 0xC03020, 1); g.lineBetween(28, 5, 28, 1);
    });

    make('eco_geiger', 56, 56, g => {
      g.fillStyle(0x000000, 0.25); g.fillEllipse(28, 50, 40, 10);
      trefoil(g, 28, 28, 24);
    });

    make('eco_sign', 36, 44, g => {
      g.fillStyle(0x5A4A38, 1); g.fillRect(16, 26, 4, 18);
      trefoil(g, 18, 16, 14);
    });

    make('eco_stake', 56, 60, g => {
      g.fillStyle(0x7A5A32, 1); g.fillRect(24, 6, 8, 52);
      g.fillStyle(0xF0E8D0, 1);
      for (let y = 12; y < 54; y += 8) g.fillRect(24, y, 8, 2);
      g.fillStyle(0x4A98B4, 0.8); g.fillRect(14, 50, 28, 8);
    });

    make('eco_papers', 56, 56, g => {
      g.fillStyle(0x6A4A28, 1); g.fillRect(6, 28, 44, 20);
      g.fillStyle(0xF0E8D0, 1); g.fillRect(10, 14, 18, 16); g.fillRect(28, 10, 18, 18);
      g.lineStyle(1, 0x8A7A66, 1);
      for (let y = 17; y < 28; y += 4) { g.lineBetween(12, y, 26, y); g.lineBetween(30, y - 3, 44, y - 3); }
    });

    make('eco_gate', 56, 56, g => {
      g.fillStyle(0x7A7A7A, 1); g.fillRect(4, 10, 8, 44); g.fillRect(44, 10, 8, 44);
      g.fillStyle(0xC03020, 1); g.fillRect(12, 22, 32, 7);
      g.fillStyle(0xF0F0F0, 1);
      for (let x = 14; x < 42; x += 10) g.fillRect(x, 22, 5, 7);
      g.fillStyle(0xF0C020, 1); g.fillCircle(8, 8, 5);
    });

    make('eco_dam', 56, 56, g => {
      g.fillStyle(0x4A98B4, 0.85); g.fillRect(0, 34, 14, 22);
      g.fillStyle(0x8A8478, 1);
      for (let i = 0; i < 7; i++) g.fillCircle(8 + i * 6, 42, 7);
      g.fillStyle(0x6E685E, 1);
      for (let i = 0; i < 6; i++) g.fillCircle(11 + i * 7, 32, 6);
    });

    make('eco_council', 64, 64, g => {
      g.fillStyle(0x000000, 0.25); g.fillEllipse(32, 56, 56, 10);
      g.fillStyle(0x4A2E14, 1); g.fillEllipse(32, 42, 60, 30);
      g.fillStyle(0x7A5230, 1); g.fillEllipse(32, 37, 56, 26);
      g.fillStyle(0xE8DCB8, 1); g.fillEllipse(32, 37, 36, 16);
      g.fillStyle(0x7FD8E8, 0.95); g.fillCircle(32, 17, 10);
      g.lineStyle(2, 0x1A3A50, 1); g.strokeCircle(32, 17, 10);
      g.lineBetween(32, 17, 32, 11); g.lineBetween(32, 17, 37, 19);
    });

    make('eco_tent', 60, 50, g => {
      g.fillStyle(0x000000, 0.2); g.fillEllipse(30, 46, 56, 8);
      g.fillStyle(0xD8C8A0, 1); g.fillTriangle(30, 4, 3, 46, 57, 46);
      g.fillStyle(0xBCAC84, 1); g.fillTriangle(30, 4, 30, 46, 57, 46);
      g.fillStyle(0x3A2A18, 1); g.fillTriangle(30, 24, 22, 46, 38, 46);
    });

    make('eco_ship', 120, 60, g => {
      g.fillStyle(0x7A4A2E, 1);
      g.fillPoints([{ x: 6, y: 26 }, { x: 112, y: 26 }, { x: 96, y: 52 }, { x: 20, y: 52 }], true);
      g.fillStyle(0x5A3420, 1); g.fillRect(8, 26, 102, 4);
      g.fillStyle(0x6A4A38, 1); g.fillRect(40, 8, 34, 18);
      g.fillStyle(0x203040, 1); g.fillRect(46, 13, 8, 6); g.fillRect(60, 13, 8, 6);
      g.lineStyle(3, 0x4A3828, 1); g.lineBetween(90, 26, 94, 2);
      g.fillStyle(0xA05A28, 0.8);
      g.fillCircle(30, 38, 4); g.fillCircle(66, 42, 5); g.fillCircle(88, 36, 3);
    });

    make('eco_saxaul', 40, 40, g => {
      g.fillStyle(0x000000, 0.18); g.fillEllipse(20, 35, 24, 7);
      g.lineStyle(2.5, 0x6B583E, 1);
      g.lineBetween(20, 34, 14, 18);
      g.lineBetween(20, 34, 26, 16);
      g.lineBetween(20, 26, 10, 12);
      g.lineBetween(20, 26, 30, 12);
      g.fillStyle(0x7A8E52, 0.85);
      g.fillCircle(12, 13, 7);
      g.fillCircle(26, 13, 8);
      g.fillCircle(19, 10, 7);
    });

    make('eco_well', 48, 48, g => {
      g.fillStyle(0x000000, 0.25); g.fillEllipse(24, 40, 40, 12);
      g.fillStyle(0x7A746A, 1); g.fillEllipse(24, 30, 36, 22);
      g.fillStyle(0x263844, 1); g.fillEllipse(24, 28, 24, 14);
      g.lineStyle(3, 0x5A3E24, 1);
      g.lineBetween(10, 28, 10, 8);
      g.lineBetween(38, 28, 38, 8);
      g.lineBetween(8, 10, 40, 10);
    });

    make('eco_player_suit', 48, 48, g => {
      g.fillStyle(0x000000, 0.28); g.fillEllipse(24, 44, 28, 10);
      g.fillStyle(0xE8B828, 1); g.fillRoundedRect(12, 17, 24, 25, 7);
      g.fillStyle(0x9A7414, 1); g.fillRect(22, 19, 4, 22);
      g.fillStyle(0x3A3A3A, 1); g.fillRect(13, 29, 22, 3);
      g.fillStyle(0xE8B828, 1); g.fillCircle(24, 13, 10);
      g.fillStyle(0x7FD8E8, 0.92); g.fillRoundedRect(17, 9, 14, 8, 3);
      g.lineStyle(1.5, 0x222222, 1); g.strokeRoundedRect(17, 9, 14, 8, 3);
      g.fillStyle(0x2A2A2A, 1); g.fillRect(14, 41, 8, 4); g.fillRect(26, 41, 8, 4);
    });

    make('eco_crate', 56, 52, g => {
      g.fillStyle(0x000000, 0.25); g.fillEllipse(28, 46, 48, 10);
      g.fillStyle(0x5B6E3A, 1); g.fillRoundedRect(8, 14, 40, 30, 5);
      g.lineStyle(2, 0x2E3A1C, 1); g.strokeRoundedRect(8, 14, 40, 30, 5);
      g.fillStyle(0xE8B828, 1); g.fillRect(12, 26, 32, 6);
      trefoil(g, 28, 29, 8);
    });

    make('eco_decon', 56, 60, g => {
      g.fillStyle(0x000000, 0.25); g.fillEllipse(28, 54, 46, 10);
      g.fillStyle(0xD8E4E8, 1); g.fillRoundedRect(12, 12, 32, 40, 6);
      g.lineStyle(2, 0x4A7A8C, 1); g.strokeRoundedRect(12, 12, 32, 40, 6);
      g.fillStyle(0x3A98B4, 0.85); g.fillRect(16, 18, 24, 26);
      g.fillStyle(0x7ABF5A, 1);
      g.fillRect(26, 6, 4, 12); g.fillRect(22, 10, 12, 4);
    });

    make('eco_barrel', 44, 48, g => {
      g.fillStyle(0x000000, 0.25); g.fillEllipse(22, 42, 34, 9);
      g.fillStyle(0x3B7EA1, 1); g.fillRoundedRect(10, 10, 24, 32, 6);
      g.lineStyle(2, 0x1E465C, 1); g.strokeRoundedRect(10, 10, 24, 32, 6);
      g.fillStyle(0xBFE8F4, 0.9); g.fillCircle(22, 26, 5);
    });

    make('eco_plant_spot', 48, 48, g => {
      g.lineStyle(2.5, 0x7ABF5A, 0.9);
      g.strokeCircle(24, 24, 18);
      g.fillStyle(0x7ABF5A, 0.22);
      g.fillCircle(24, 24, 16);
      g.fillStyle(0x6B583E, 0.9);
      g.fillCircle(24, 24, 5);
    });
  }

  addSolidCollider(x, y, w, h) {
    const zone = this.add.rectangle(x, y, w, h, 0x000000, 0);
    this.physics.add.existing(zone, true);
    this.obstacles.add(zone);
    return zone;
  }

  // ==================== WORLD ====================
  getWaterFrac() {
    const e = this.state.era;
    if (e === 0) return 1.0;
    if (e === 1) return 0.92;
    return 0.28 + (this.state.stats.aral / 100) * 0.54;
  }

  redrawWorld() {
    const g = this.worldGfx;
    const W = this.W, H = this.H;
    const westX = this.westBorderX;
    const eastX = this.eastBorderX;
    g.clear();

    // 1. Base terrain colors for the 3 regions
    g.fillStyle(0xC9B27A, 1); g.fillRect(0, 0, westX, H); // Aral sandy basin
    g.fillStyle(0x6E8A4C, 1); g.fillRect(westX, 0, eastX - westX, H); // Central green steppe hub
    g.fillStyle(0x8C8272, 1); g.fillRect(eastX, 0, W - eastX, H); // Semipalatinsk polygon dry steppe

    // Soft transition strips at borders
    g.fillStyle(0x9FA060, 0.45); g.fillRect(westX - 30, 0, 60, H);
    g.fillStyle(0x7C8660, 0.45); g.fillRect(eastX - 30, 0, 60, H);

    // 2. Terrain speckles and steppe grass texture
    const rng = new Phaser.Math.RandomDataGenerator(['eco-world-v2']);
    const sand = [0xBBA46C, 0xD4BE86, 0xB09A62];
    const grass = [0x628040, 0x7A9658, 0x587436];
    const ash = [0x7C7262, 0x9A9080, 0x6E6454];
    for (let i = 0; i < 650; i++) {
      const x = rng.between(0, W);
      const y = rng.between(0, H);
      const k = rng.between(0, 2);
      const col = x < westX ? sand[k] : (x < eastX ? grass[k] : ash[k]);
      g.fillStyle(col, 0.68);
      g.fillCircle(x, y, rng.between(2, 8));
    }

    // 3. Aral Sea (shrinks depending on era and the player's decisions)
    const frac = this.getWaterFrac();
    this.aralShore = 220 + 580 * frac; // up to x=800 at full level
    this.aralRy = 300 + 480 * frac;    // centered at y=800

    // Dry historical seabed contour (1960 shoreline trace)
    g.lineStyle(2, 0xA89260, 0.55);
    g.strokeEllipse(0, 800, 800 * 2, 780 * 2);

    const rings = [
      [0xB09A68, 0, 0],
      [0x6FB4C4, 28, 24],
      [0x4A98B4, 78, 65],
      [0x347CA0, 150, 120],
      [0x245E80, 240, 200],
    ];
    rings.forEach(([col, sx, sy]) => {
      const rx = this.aralShore - sx;
      const ry = this.aralRy - sy;
      if (rx > 24 && ry > 24) {
        g.fillStyle(col, 1);
        g.fillEllipse(0, 800, rx * 2, ry * 2);
      }
    });

    // Salt crust (Aralkum) on the exposed seabed
    for (let i = 0; i < 180; i++) {
      const x = rng.between(20, 790);
      const y = rng.between(60, H - 60);
      const sw = rng.between(12, 42);
      const sh = rng.between(4, 12);
      const insideFull = (x / 800) ** 2 + ((y - 800) / 780) ** 2 < 1;
      const insideNow = (x / this.aralShore) ** 2 + ((y - 800) / this.aralRy) ** 2 < 1;
      if (insideFull && !insideNow) {
        g.fillStyle(0xF2EFE4, 0.58);
        g.fillRect(x, y, sw, sh);
      }
    }

    // Irrigation canal in northern Aral zone & Syr Darya delta stream in the south
    g.fillStyle(0x8C7450, 0.9);
    g.fillRect(720, 355, 510, 32);
    g.fillStyle(0x4A98B4, 0.85);
    g.fillRect(720, 361, 510, 20);

    // Syr Darya river branch feeding the Kokaral strait area
    g.lineStyle(26, 0x8C7450, 0.7);
    g.lineBetween(1240, 1430, 890, 1320);
    g.lineBetween(890, 1320, 560, 1220);
    g.lineStyle(16, 0x4A98B4, 0.85);
    g.lineBetween(1240, 1430, 890, 1320);
    g.lineBetween(890, 1320, 560, 1220);

    // Wooden pier at Port of Aralsk
    g.fillStyle(0x5C4028, 1);
    g.fillRect(680, 766, 185, 28);
    g.lineStyle(2, 0x3E2A18, 0.9);
    for (let px = 690; px <= 855; px += 14) {
      g.lineBetween(px, 766, px, 794);
    }

    // 4. Central Hub Plaza, Roads & Pathways
    // Main east-west expedition highway at y = 800
    g.fillStyle(0x9E8D70, 0.85);
    g.fillRect(860, 776, 2320, 48);
    g.lineStyle(2, 0xC4B494, 0.45);
    g.lineBetween(860, 776, 3180, 776);
    g.lineBetween(860, 824, 3180, 824);

    // North-south avenue in the Hub
    g.fillStyle(0x9E8D70, 0.8);
    g.fillRect(1778, 400, 44, 780);

    // Central Chronicle Plaza at (1800, 800)
    g.fillStyle(0xB8A888, 1); g.fillCircle(1800, 800, 220);
    g.fillStyle(0xA89878, 1); g.fillCircle(1800, 800, 165);
    g.lineStyle(2, 0xC4A46C, 0.55);
    g.strokeCircle(1800, 800, 220);
    g.strokeCircle(1800, 800, 165);

    // Secondary dirt paths to Dolon village & Bunker in Polygon
    g.lineStyle(22, 0x7A7060, 0.7);
    g.lineBetween(2560, 800, 2560, 1080);
    g.lineBetween(2560, 1080, 3020, 1080);
    g.lineBetween(2620, 800, 2620, 540);
    g.lineBetween(2620, 540, 2740, 380);

    // 5. Polygon Ground Zero Crater (Epicenter at 3220, 480)
    g.fillStyle(0x5E564A, 1); g.fillEllipse(3220, 480, 420, 260);
    g.fillStyle(0x4A4238, 1); g.fillEllipse(3220, 480, 290, 175);
    g.fillStyle(0x38322A, 1); g.fillEllipse(3220, 480, 170, 100);
    if (this.state.era >= 2) {
      // Atomic lake water in later eras
      g.fillStyle(0x2F6878, 0.85);
      g.fillEllipse(3220, 480, 140, 82);
    }

    // 6. Radiation haze (fades as health of the timeline improves)
    const hz = this.hazeGfx;
    hz.clear();
    const a = Math.max(0.05, 0.24 - this.state.stats.health * 0.0022);
    HOTSPOTS.forEach(h => {
      [1, 0.66, 0.33].forEach(f => {
        hz.fillStyle(0xC03020, a);
        hz.fillCircle(h.x, h.y, h.r * f);
      });
    });

    // 7. Dry-land ships appear where the sea has retreated
    this.ships.forEach(s => {
      const inside = (s.x / this.aralShore) ** 2 + ((s.y - 800) / this.aralRy) ** 2 < 1;
      s.setVisible(!inside);
    });

    // 8. Era color tone
    if (this.eraOverlay) {
      this.eraOverlay.setFillStyle(ERAS[this.state.era].tint, 0.11);
    }

    // 9. Idea 4 — Visual evolution of the world ("Memory of the Land")
    if (this.state.choices && this.state.choices[1] === 0 && this.state.era >= 2) {
      // Concrete-lined irrigation canal banks saved in 1960
      g.fillStyle(0xD8D4CC, 0.95);
      g.fillRect(720, 350, 510, 7);
      g.fillRect(720, 385, 510, 7);
      g.lineStyle(1.5, 0x7A98A6, 0.9);
      g.strokeRect(720, 350, 510, 42);
    }
    this.updateLegacyLandmarks();

    // 10. Redraw dynamic zone border checkpoints (barriers open/closed per era)
    this.redrawCheckpoints();
  }

  updateLegacyLandmarks() {
    if (this.legacyItems) {
      this.legacyItems.forEach(item => { if (item && item.destroy) item.destroy(); });
    }
    this.legacyItems = [];
    const choices = this.state.choices || [];
    const era = this.state.era;

    // 1949 Legacy: Downwinders Memorial Stele in the Hub (visible in 1989 & 1991 if best choice in 1949)
    if (era >= 2 && choices[0] !== undefined) {
      if (choices[0] === 0) {
        const stele = this.add.graphics().setDepth(4);
        stele.fillStyle(0x000000, 0.25);
        stele.fillEllipse(1640, 898, 48, 14);
        stele.fillStyle(0x8A8478, 1);
        stele.fillRect(1622, 882, 36, 14);
        stele.fillStyle(0xD8CFC0, 1);
        stele.fillTriangle(1628, 882, 1652, 882, 1640, 834);
        stele.lineStyle(1.5, 0xFFD700, 0.8);
        stele.strokeRect(1622, 882, 36, 14);
        const lbl = this.add.text(1640, 822, '✦ 1949 Memorial: Evacuated Auls', {
          fontFamily: FONT_H, fontSize: '10px', color: '#7ABF5A',
          backgroundColor: 'rgba(20,10,4,0.8)', padding: { x: 5, y: 2 },
        }).setOrigin(0.5).setDepth(6);
        this.legacyItems.push(stele, lbl);
      } else if (choices[0] === 2) {
        const lbl = this.add.text(1640, 868, '⚠ 1949 Legacy: Unwarned Downwinders', {
          fontFamily: FONT_H, fontSize: '10px', color: '#E05040',
          backgroundColor: 'rgba(20,10,4,0.8)', padding: { x: 5, y: 2 },
        }).setOrigin(0.5).setDepth(6);
        this.legacyItems.push(lbl);
      }
    }

    // 1960 Legacy: Concrete-lined canal & green saxaul shelterbelt in Aral zone (visible in 1991)
    if (era >= 2 && choices[1] === 0) {
      const canalLbl = this.add.text(975, 336, '✦ 1960 Legacy: Concrete-Lined Canal (+Aral Flow)', {
        fontFamily: FONT_H, fontSize: '10px', color: '#6FB4C4',
        backgroundColor: 'rgba(20,10,4,0.8)', padding: { x: 5, y: 2 },
      }).setOrigin(0.5).setDepth(6);
      this.legacyItems.push(canalLbl);
      [[780, 620], [810, 900], [790, 1140]].forEach(([sx, sy]) => {
        const bush = this.add.image(sx, sy, 'eco_saxaul').setDepth(4);
        this.legacyItems.push(bush);
      });
    }

    // 1989 Legacy: Citizens gathered at the Nevada-Semey Tribune in 1991
    if (era >= 3 && choices[2] === 0) {
      [[1735, 1155, 0xE0C8A0], [1865, 1155, 0xB8D8E0], [1765, 1135, 0xD8B8C8], [1835, 1135, 0xC8E0B8]].forEach(([nx, ny, tint]) => {
        const citizen = this.add.image(nx, ny, 'eco_npc').setTint(tint).setDepth(4).setScale(0.92);
        this.legacyItems.push(citizen);
      });
      const rallyLbl = this.add.text(1800, 1105, '✦ 1989 Legacy: Nevada–Semey Public Victory', {
        fontFamily: FONT_H, fontSize: '10px', color: '#FFD700',
        backgroundColor: 'rgba(20,10,4,0.82)', padding: { x: 5, y: 2 },
      }).setOrigin(0.5).setDepth(6);
      this.legacyItems.push(rallyLbl);
    }
  }

  createZoneLabels() {
    const style = { fontFamily: FONT_H, fontSize: '28px', color: '#FFFFFF', letterSpacing: 4 };
    this.add.text(620, 52, 'ARAL REGION & ARAL SEA', style).setOrigin(0.5).setAlpha(0.48).setDepth(1);
    this.add.text(1800, 52, 'CENTRAL CHRONICLERS HUB', style).setOrigin(0.5).setAlpha(0.48).setDepth(1);
    this.add.text(2975, 52, 'SEMIPALATINSK TEST SITE', style).setOrigin(0.5).setAlpha(0.48).setDepth(1);
  }

  createBuildingsAndLandmarks() {
    const g = this.add.graphics().setDepth(4);

    ECO_BUILDINGS.forEach(b => {
      const left = b.x - b.w / 2;
      const top = b.y - b.h / 2;

      // Drop shadow
      g.fillStyle(0x000000, 0.26);
      g.fillRoundedRect(left + 6, top + 8, b.w, b.h, 8);

      if (b.type === 'yurt') {
        g.fillStyle(b.color, 1);
        g.fillEllipse(b.x, b.y + 8, b.w, b.h * 0.78);
        g.fillStyle(0xE8D8B4, 1);
        g.fillEllipse(b.x, b.y - 14, b.w * 0.72, b.h * 0.45);
        g.lineStyle(2, 0x8B5A2B, 0.85);
        g.strokeEllipse(b.x, b.y + 8, b.w, b.h * 0.78);
        g.fillStyle(0x5C3A1E, 1);
        g.fillRoundedRect(b.x - 14, b.y + 10, 28, 32, 4);
      } else if (b.type === 'lighthouse') {
        g.fillStyle(b.color, 1);
        g.fillPoints([
          { x: b.x - 26, y: bottomY(b) },
          { x: b.x + 26, y: bottomY(b) },
          { x: b.x + 16, y: top + 18 },
          { x: b.x - 16, y: top + 18 },
        ], true);
        g.fillStyle(0xB83A28, 1);
        g.fillRect(b.x - 21, b.y - 8, 42, 16);
        g.fillStyle(0xFFE070, 0.95);
        g.fillCircle(b.x, top + 14, 14);
        g.lineStyle(2, 0x3A2A18, 0.9);
        g.strokeCircle(b.x, top + 14, 14);
      } else if (b.type === 'tribune') {
        g.fillStyle(0x6E281E, 1);
        g.fillRoundedRect(left, top, b.w, b.h, 6);
        g.fillStyle(0x9E382A, 1);
        g.fillRect(left + 8, top + 8, b.w - 16, 26);
        g.lineStyle(2, 0xFFD700, 0.85);
        g.strokeRoundedRect(left, top, b.w, b.h, 6);
        this.add.text(b.x, top + 21, 'NEVADA — SEMEY', {
          fontFamily: FONT_H, fontSize: '13px', color: '#FFE8C0', letterSpacing: 3,
        }).setOrigin(0.5).setDepth(5);
      } else if (b.type === 'bunker') {
        g.fillStyle(0x565A54, 1);
        g.fillRoundedRect(left, top, b.w, b.h, 12);
        g.fillStyle(0x3E423C, 1);
        g.fillRoundedRect(left + 12, top + 14, b.w - 24, b.h - 28, 8);
        g.lineStyle(2, 0x2A2E28, 0.9);
        g.strokeRoundedRect(left, top, b.w, b.h, 12);
        g.fillStyle(0x1E221E, 1);
        g.fillRect(b.x - 18, top + b.h - 24, 36, 24);
      } else {
        // Standard architectural building (academy, clinic, cannery, house, brick)
        g.fillStyle(b.color, 1);
        g.fillRoundedRect(left, top, b.w, b.h, 6);
        g.fillStyle(0x5A3E28, 0.92);
        g.fillRoundedRect(left - 4, top - 6, b.w + 8, 28, 5);
        g.lineStyle(2, 0x3A2818, 0.85);
        g.strokeRoundedRect(left, top, b.w, b.h, 6);

        // Windows
        g.fillStyle(0x2B4458, 0.85);
        const winCount = Math.max(2, Math.floor((b.w - 30) / 38));
        for (let i = 0; i < winCount; i++) {
          const wx = left + 18 + i * ((b.w - 36) / Math.max(1, winCount - 1)) - 8;
          g.fillRect(wx, b.y - 6, 16, 18);
        }
        // Door
        g.fillStyle(0x3D2514, 1);
        g.fillRect(b.x - 11, top + b.h - 26, 22, 26);

        if (b.type === 'clinic') {
          g.fillStyle(0xC83028, 1);
          g.fillRect(b.x - 3, top + 6, 6, 16);
          g.fillRect(b.x - 8, top + 11, 16, 6);
        }
      }

      // Building nameplate
      this.add.text(b.x, top - 14, b.label, {
        fontFamily: FONT_H, fontSize: '11px', color: '#E8D5B0',
        backgroundColor: 'rgba(20,10,4,0.72)', padding: { x: 5, y: 2 },
      }).setOrigin(0.5).setDepth(6);

      // Solid collider
      this.addSolidCollider(b.x, b.y, b.w - 8, b.h - 8);
    });

    function bottomY(b) {
      return b.y + b.h / 2;
    }
  }

  createDecor() {
    // Expedition tents in Hub and near Dolon
    const tentCoords = [
      [1520, 1040], [2080, 1040], [1540, 700], [2060, 700],
      [2460, 960], [2700, 960],
    ];
    tentCoords.forEach(([x, y]) => {
      this.add.image(x, y, 'eco_tent').setDepth(4);
      this.addSolidCollider(x, y + 6, 46, 32);
    });

    // Village well in Dolon
    this.add.image(2680, 1250, 'eco_well').setDepth(4);
    this.addSolidCollider(2680, 1250, 34, 28);

    // Radiation warning signs along the Polygon perimeter & hotspots
    const signCoords = [
      [2385, 720], [2385, 880], [2420, 440], [2420, 1180],
      [2920, 480], [3480, 480], [3220, 260], [3220, 700],
      [2880, 1060], [3160, 1120],
    ];
    signCoords.forEach(([x, y]) => {
      this.add.image(x, y, 'eco_sign').setDepth(4);
    });

    // Trees in Central Hub & Relict Pine Belt near Dolon
    const treeCoords = [
      [1360, 320], [1360, 620], [1360, 960], [1360, 1280],
      [1640, 300], [1960, 300], [1620, 1260], [1980, 1260],
      [2240, 320], [2240, 620], [2240, 960], [2240, 1280],
      // Dolon pine belt (Ribbon Pine Forest)
      [2460, 1340], [2580, 1380], [2720, 1380], [2900, 1340],
      [2480, 660], [2540, 420],
    ];
    treeCoords.forEach(([x, y]) => {
      if (this.textures.exists('tree')) {
        this.add.image(x, y, 'tree').setDepth(4);
      } else {
        this.add.image(x, y, 'eco_saxaul').setDepth(4);
      }
      this.addSolidCollider(x, y + 10, 28, 24);
    });

    // Desert saxaul bushes in the Aral region
    const saxaulCoords = [
      [920, 180], [1160, 190], [880, 440], [1150, 440],
      [900, 680], [1140, 700], [870, 960], [1130, 960],
      [840, 1220], [1140, 1380], [660, 1440], [720, 1100],
    ];
    saxaulCoords.forEach(([x, y]) => {
      this.add.image(x, y, 'eco_saxaul').setDepth(4);
    });

    // Stranded ships on the Aral seabed (appear when sea retreats)
    const shipCoords = [
      [540, 500, 6],
      [480, 940, -8],
      [600, 1180, 4],
      [380, 700, -5],
    ];
    shipCoords.forEach(([x, y, ang]) => {
      const s = this.add.image(x, y, 'eco_ship').setDepth(4).setAngle(ang);
      this.ships.push(s);
    });

    // Chronicle Table central collider
    this.addSolidCollider(1800, 800, 52, 34);

    this.eraOverlay = this.add.rectangle(512, 384, 1024, 768, 0xFFFFFF, 0.1)
      .setScrollFactor(0).setDepth(45);
  }

  createCheckpointsUI() {
    this.westGateLabel = this.add.text(this.westBorderX, 710, '', {
      fontFamily: FONT_H, fontSize: '11px', color: '#FFE8C0',
      backgroundColor: 'rgba(26,14,6,0.85)', padding: { x: 6, y: 3 }, align: 'center',
    }).setOrigin(0.5).setDepth(30);

    this.eastGateLabel = this.add.text(this.eastBorderX, 710, '', {
      fontFamily: FONT_H, fontSize: '11px', color: '#FFE8C0',
      backgroundColor: 'rgba(26,14,6,0.85)', padding: { x: 6, y: 3 }, align: 'center',
    }).setOrigin(0.5).setDepth(30);
  }

  redrawCheckpoints() {
    if (!this.checkpointGfx) return;
    const g = this.checkpointGfx;
    g.clear();

    const era = ERAS[this.state.era];
    const az = era.allowedZones || { minX: 0, maxX: this.W };
    const westOpen = az.minX < this.westBorderX;
    const eastOpen = az.maxX > this.eastBorderX;

    this.drawBorderLineAndGate(g, this.westBorderX, westOpen);
    this.drawBorderLineAndGate(g, this.eastBorderX, eastOpen);

    if (this.westGateLabel) {
      this.westGateLabel.setText(
        westOpen ? '◀ ARAL CHECKPOINT: OPEN' : '🔒 ARAL CHECKPOINT: LOCKED IN ' + era.year
      );
      this.westGateLabel.setColor(westOpen ? '#7ABF5A' : '#FF8080');
    }
    if (this.eastGateLabel) {
      this.eastGateLabel.setText(
        eastOpen ? 'POLYGON CHECKPOINT: OPEN ▶' : '🔒 POLYGON CHECKPOINT: LOCKED IN ' + era.year
      );
      this.eastGateLabel.setColor(eastOpen ? '#7ABF5A' : '#FF8080');
    }
  }

  drawBorderLineAndGate(g, bx, isOpen) {
    // Fence posts along the vertical border (except road gap 755..845)
    g.lineStyle(2, isOpen ? 0x6A7A58 : 0x8A382E, isOpen ? 0.35 : 0.7);
    g.lineBetween(bx, 0, bx, 750);
    g.lineBetween(bx, 850, bx, this.H);

    for (let y = 60; y < this.H; y += 90) {
      if (y > 720 && y < 880) continue;
      g.fillStyle(0x4E3A28, 0.9);
      g.fillRect(bx - 4, y - 10, 8, 20);
    }

    // Checkpoint pillars at the road (y = 752 and y = 848)
    g.fillStyle(0x5A5248, 1);
    g.fillRect(bx - 10, 738, 20, 24);
    g.fillRect(bx - 10, 838, 20, 24);
    g.fillStyle(isOpen ? 0x5ABF5A : 0xE04030, 1);
    g.fillCircle(bx, 744, 5);
    g.fillCircle(bx, 856, 5);

    if (!isOpen) {
      // Lowered red-and-white barrier beam blocking the road
      g.fillStyle(0xC83028, 1);
      g.fillRect(bx - 6, 758, 12, 84);
      g.fillStyle(0xF0F0F0, 1);
      for (let y = 766; y < 836; y += 20) {
        g.fillRect(bx - 6, y, 12, 10);
      }
    } else {
      // Raised barrier beam
      g.fillStyle(0x5ABF5A, 0.85);
      g.fillRect(bx - 18, 734, 36, 6);
    }
  }

  isSuitObj(o) {
    return Boolean(o && (o.suit || o.special === 'suit'));
  }

  isDeconObj(o) {
    return Boolean(o && (o.decon || o.special === 'decon'));
  }

  hasCloudEra(era = this.state.era) {
    if (!CLOUD_ERAS) return false;
    return Array.isArray(CLOUD_ERAS) ? CLOUD_ERAS.includes(era) : Boolean(CLOUD_ERAS[era]);
  }

  createInteractables() {
    ECO_OBJECTS.forEach(o => {
      const sprite = this.add.image(o.x, o.y, o.texture || 'eco_npc').setDepth(5);
      if (o.tint) sprite.setTint(o.tint);
      const label = this.add.text(o.x, o.y - 46, o.name, {
        fontFamily: FONT_H, fontSize: '11px', color: '#FFE8C0',
        backgroundColor: 'rgba(26,14,6,0.75)', padding: { x: 5, y: 2 },
      }).setOrigin(0.5).setDepth(30);
      const isUtil = this.isSuitObj(o) || this.isDeconObj(o);
      const mark = this.add.text(o.x, o.y - 66, isUtil ? '✦' : '!', {
        fontFamily: FONT_H, fontSize: isUtil ? '18px' : '22px',
        color: isUtil ? '#7ABF5A' : '#FFD700', stroke: '#2A1506', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(30);
      this.tweens.add({ targets: mark, y: mark.y - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.interactables.push({ def: o, sprite, label, mark });
    });
  }

  createMissions() {
    this.missions = [];
    ECO_MISSIONS.forEach(m => {
      const giverTex = (m.giver && m.giver.texture) || 'eco_npc';
      const sprite = this.add.image(m.giver.x, m.giver.y, giverTex).setDepth(5);
      if (m.giver.tint) sprite.setTint(m.giver.tint);
      const label = this.add.text(m.giver.x, m.giver.y - 46, m.giver.name, {
        fontFamily: FONT_H, fontSize: '11px', color: '#FFE8C0',
        backgroundColor: 'rgba(26,14,6,0.75)', padding: { x: 5, y: 2 },
      }).setOrigin(0.5).setDepth(30);
      const mark = this.add.text(m.giver.x, m.giver.y - 66, '★', {
        fontFamily: FONT_H, fontSize: '20px', color: '#6FB4C4', stroke: '#1A0E06', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(30);
      this.tweens.add({ targets: mark, y: mark.y - 5, duration: 680, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      const goal = m.goal || (m.type === 'carry' ? { x: m.giver.x, y: m.giver.y, name: m.giver.name, r: 65 } : null);
      const entry = { def: m, goal, sprite, label, mark, pickup: null, goalRing: null, spots: [] };

      if (m.type === 'carry' && m.pickup) {
        const pickupTex = m.pickup.texture || 'eco_barrel';
        const ps = this.add.image(m.pickup.x, m.pickup.y, pickupTex).setDepth(5);
        const pl = this.add.text(m.pickup.x, m.pickup.y - 34, m.pickup.name || m.pickup.item || 'Water Barrel', {
          fontFamily: FONT_H, fontSize: '10px', color: '#6FB4C4',
          backgroundColor: 'rgba(26,14,6,0.75)', padding: { x: 4, y: 2 },
        }).setOrigin(0.5).setDepth(30);
        entry.pickup = { sprite: ps, label: pl };
      }

      if (goal) {
        const gr = goal.r || 60;
        const gLabelTxt = goal.label || goal.name || 'Destination';
        const g = this.add.graphics().setDepth(4);
        g.lineStyle(2, 0x6FB4C4, 0.85);
        g.strokeCircle(goal.x, goal.y, gr);
        g.fillStyle(0x6FB4C4, 0.14);
        g.fillCircle(goal.x, goal.y, gr);
        const gl = this.add.text(goal.x, goal.y - gr - 12, `▸ ${gLabelTxt}`, {
          fontFamily: FONT_H, fontSize: '10px', color: '#6FB4C4',
          backgroundColor: 'rgba(26,14,6,0.75)', padding: { x: 5, y: 2 },
        }).setOrigin(0.5).setDepth(30);
        entry.goalRing = { gfx: g, label: gl };
      }

      const rawSpots = m.sites || m.spots || [];
      if (m.type === 'plant' && rawSpots.length) {
        rawSpots.forEach((sp, idx) => {
          const ss = this.add.image(sp.x, sp.y, 'eco_plant_spot').setDepth(4);
          const sl = this.add.text(sp.x, sp.y - 28, `Planting Spot #${idx + 1}`, {
            fontFamily: FONT_H, fontSize: '10px', color: '#7ABF5A',
            backgroundColor: 'rgba(26,14,6,0.7)', padding: { x: 4, y: 1 },
          }).setOrigin(0.5).setDepth(30);
          entry.spots.push({ x: sp.x, y: sp.y, idx, sprite: ss, label: sl, planted: false });
        });
      }

      this.missions.push(entry);
    });
  }

  isActive(o) {
    if (o.era === 'all') return true;
    if (Array.isArray(o.era)) return o.era.includes(this.state.era);
    return o.era === this.state.era;
  }

  refreshAll() {
    const complete = this.evidenceCount() >= EVIDENCE_PER_ERA;
    this.interactables.forEach(it => {
      const o = it.def;
      const active = this.isActive(o);
      const done = o.evidenceId ? this.state.found.includes(o.evidenceId) : false;
      it.sprite.setVisible(active).setAlpha(done ? 0.65 : 1);
      it.label.setVisible(active);
      if (o.council) it.mark.setVisible(active && complete);
      else if (this.isSuitObj(o)) it.mark.setVisible(active && (!this.state.suit || this.suitHP < 95));
      else if (this.isDeconObj(o)) it.mark.setVisible(active && this.dose > 10);
      else it.mark.setVisible(active && !done);
    });

    if (this.missions) {
      this.missions.forEach(entry => {
        const m = entry.def;
        const active = m.era === this.state.era;
        const done = !!this.state.missions[m.id];
        const started = !!this.missionRt[m.id];
        entry.sprite.setVisible(active).setAlpha(done ? 0.65 : 1);
        entry.label.setVisible(active);
        entry.mark.setVisible(active && !done);
        if (entry.pickup) {
          const showPickup = active && started && !done && this.carrying !== m.id;
          entry.pickup.sprite.setVisible(showPickup);
          entry.pickup.label.setVisible(showPickup);
        }
        if (entry.goalRing) {
          const showGoal = active && started && !done && (m.type !== 'carry' || this.carrying === m.id);
          entry.goalRing.gfx.setVisible(showGoal);
          entry.goalRing.label.setVisible(showGoal);
        }
        entry.spots.forEach(sp => {
          const showSpot = active && started && !done;
          sp.sprite.setVisible(showSpot);
          sp.sprite.setTexture(sp.planted ? 'eco_saxaul' : 'eco_plant_spot');
          sp.label.setVisible(showSpot && !sp.planted);
        });
      });
    }

    if (this.player) {
      this.player.setTexture(this.state.suit && this.suitHP > 0 ? 'eco_player_suit' : 'eco_player');
    }
    this.redrawCheckpoints();
    this.updateHUD();
  }

  createPlayer() {
    const s = ERAS[this.state.era].start;
    this.playerShadow = this.add.image(s.x, s.y + 14, 'shadow').setDepth(9).setAlpha(0.5);
    const tex = this.state.suit ? 'eco_player_suit' : 'eco_player';
    this.player = this.physics.add.sprite(s.x, s.y, tex).setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(22, 22);
    this.player.body.setOffset(13, 20);
    this.physics.add.collider(this.player, this.obstacles);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.carryIcon = this.add.image(s.x, s.y - 34, 'eco_barrel').setScale(0.75).setDepth(15).setVisible(false);
  }

  // ==================== UI ====================
  createUI() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.ui = this.add.container(0, 0).setDepth(90).setScrollFactor(0);

    // Separate graphics for left panel (dynamic height) and right panel
    this.leftPanelGfx = this.add.graphics();
    this.rightPanelGfx = this.add.graphics();
    this.rightPanelGfx.fillStyle(0x1A0E06, 0.88);
    this.rightPanelGfx.fillRoundedRect(w - 268, 12, 256, 120, 10);
    this.rightPanelGfx.lineStyle(1.5, 0xC4A46C, 0.65);
    this.rightPanelGfx.strokeRoundedRect(w - 268, 12, 256, 120, 10);
    this.ui.add([this.leftPanelGfx, this.rightPanelGfx]);

    this.eraTitleTxt = this.add.text(24, 20, '', {
      fontFamily: FONT_H, fontSize: '13px', color: '#FFD700', wordWrap: { width: 398 }, lineSpacing: 2,
    });
    this.eraObjTxt = this.add.text(24, 42, '', {
      fontFamily: FONT_B, fontSize: '11.5px', color: '#E8D5B0', wordWrap: { width: 398 }, lineSpacing: 2,
    });
    this.evTxt = this.add.text(24, 92, '', {
      fontFamily: FONT_H, fontSize: '11px', color: '#C4A46C', letterSpacing: 1,
    });
    this.misTxt = this.add.text(24, 110, '', {
      fontFamily: FONT_B, fontSize: '11px', color: '#6FB4C4', wordWrap: { width: 398 }, lineSpacing: 2,
    });
    this.ui.add([this.eraTitleTxt, this.eraObjTxt, this.evTxt, this.misTxt]);

    this.meterGfx = this.add.graphics();
    this.ui.add(this.meterGfx);
    this.meterDefs = [
      { key: 'aral', label: 'ARAL SEA', color: 0x4A98B4, y: 24 },
      { key: 'health', label: 'PUBLIC HEALTH', color: 0x7ABF5A, y: 50 },
      { key: 'awareness', label: 'PUBLIC VOICE', color: 0xE0B040, y: 76 },
    ];
    this.meterDefs.forEach(m => {
      m.labelTxt = this.add.text(w - 256, m.y - 2, m.label, { fontFamily: FONT_H, fontSize: '10px', color: '#C4A46C' });
      m.valTxt = this.add.text(w - 22, m.y - 2, '0', { fontFamily: FONT_H, fontSize: '11px', color: '#FFE8C0' }).setOrigin(1, 0);
      this.ui.add([m.labelTxt, m.valTxt]);
    });

    // Menu return button inside top-right panel
    const menuBtn = this.add.text(w - 140, 111, '[ ⌂ SELECT CAMPAIGN / ESC ]', {
      fontFamily: FONT_H, fontSize: '10px', color: '#C4A46C', letterSpacing: 1,
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerover', () => menuBtn.setColor('#FFE8C0'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#C4A46C'));
    menuBtn.on('pointerdown', () => this.returnToCampaignMenu());
    this.ui.add(menuBtn);

    // Top-center Radiation / Suit / Cloud alert panel (non-overlapping slot x: 444..744)
    const radCx = 594;
    this.radBox = this.add.container(0, 0).setDepth(91).setScrollFactor(0);
    this.radGfx = this.add.graphics();
    this.radTitle = this.add.text(radCx, 26, '', {
      fontFamily: FONT_H, fontSize: '11px', color: '#FFD700', letterSpacing: 1,
    }).setOrigin(0.5);
    this.radDoseLabel = this.add.text(458, 46, 'DOSE', {
      fontFamily: FONT_H, fontSize: '10px', color: '#C4A46C',
    });
    this.radDoseVal = this.add.text(732, 45, '0%', {
      fontFamily: FONT_H, fontSize: '11px', color: '#FFE8C0',
    }).setOrigin(1, 0);
    this.radSuitLabel = this.add.text(458, 70, 'HAZMAT', {
      fontFamily: FONT_H, fontSize: '10px', color: '#C4A46C',
    });
    this.radSuitVal = this.add.text(732, 69, 'NONE', {
      fontFamily: FONT_H, fontSize: '11px', color: '#FFE8C0',
    }).setOrigin(1, 0);
    this.radSub = this.add.text(radCx, 98, '', {
      fontFamily: FONT_B, fontSize: '10.5px', color: '#E8D5B0',
    }).setOrigin(0.5);
    this.radBox.add([
      this.radGfx, this.radTitle,
      this.radDoseLabel, this.radDoseVal,
      this.radSuitLabel, this.radSuitVal,
      this.radSub,
    ]);
    this.radBox.setScrollFactor(0, 0, true);

    // Bottom-left Field Radar / Direction Finder (Idea 5 - replaces golden arrow)
    this.radarBox = this.add.container(0, 0).setDepth(91).setScrollFactor(0);
    this.radarGfx = this.add.graphics();
    this.radarHeader = this.add.text(82, h - 182, 'DIRECTION FINDER [R]', {
      fontFamily: FONT_H, fontSize: '9.5px', color: '#7ABF5A', letterSpacing: 1,
    }).setOrigin(0.5);
    this.radarDistTxt = this.add.text(82, h - 46, '', {
      fontFamily: FONT_B, fontSize: '11px', color: '#C4A46C',
    }).setOrigin(0.5);
    this.radarBox.add([this.radarGfx, this.radarHeader, this.radarDistTxt]);
    this.radarBox.setScrollFactor(0, 0, true);

    this.hintTxt = this.add.text(14, h - 22, 'WASD — Move  •  E — Interact  •  R — Radar  •  TAB — Evidence  •  M — Mute  •  ESC — Menu', {
      fontFamily: FONT_B, fontSize: '11px', color: '#E8D5B0',
      backgroundColor: 'rgba(26,14,6,0.65)', padding: { x: 6, y: 3 },
    });
    this.promptTxt = this.add.text(w / 2, h - 70, '', {
      fontFamily: FONT_H, fontSize: '14px', color: '#FFE8C0',
      backgroundColor: 'rgba(26,14,6,0.88)', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setVisible(false);
    this.ui.add([this.hintTxt, this.promptTxt]);
    this.ui.setScrollFactor(0, 0, true);

    // Geiger readout
    this.geigerBox = this.add.container(w - 196, h - 76).setScrollFactor(0).setDepth(91);
    const gbg = this.add.graphics();
    gbg.fillStyle(0x1A0E06, 0.88); gbg.fillRoundedRect(0, 0, 182, 52, 8);
    gbg.lineStyle(1.5, 0xF0C020, 0.7); gbg.strokeRoundedRect(0, 0, 182, 52, 8);
    this.geigerLabel = this.add.text(10, 6, '☢ GEIGER COUNTER', { fontFamily: FONT_H, fontSize: '10px', color: '#F0C020' });
    this.geigerVal = this.add.text(10, 24, '0.1 µSv/h', { fontFamily: FONT_H, fontSize: '17px', color: '#7ABF5A' });
    this.geigerBox.add([gbg, this.geigerLabel, this.geigerVal]);
    this.geigerBox.setScrollFactor(0, 0, true);
    this.geigerBox.setVisible(false);

    // Dialogue box
    this.dlg = this.add.container(0, 0).setDepth(100).setScrollFactor(0).setVisible(false);
    const dbg = this.add.graphics();
    dbg.fillStyle(0x1A0E06, 0.95); dbg.fillRoundedRect(40, h - 190, w - 80, 160, 12);
    dbg.lineStyle(2, 0xC4A46C, 0.8); dbg.strokeRoundedRect(40, h - 190, w - 80, 160, 12);
    this.dlgSpeaker = this.add.text(62, h - 178, '', { fontFamily: FONT_H, fontSize: '15px', color: '#FFD700', letterSpacing: 1 });
    this.dlgBody = this.add.text(62, h - 148, '', {
      fontFamily: FONT_B, fontSize: '15px', color: '#F0E4C8', wordWrap: { width: w - 124 }, lineSpacing: 5,
    });
    this.dlgHint = this.add.text(w - 62, h - 52, 'SPACE ▸', { fontFamily: FONT_H, fontSize: '12px', color: '#C4A46C' }).setOrigin(1, 0);
    const dhit = this.add.rectangle(w / 2, h - 110, w - 80, 160, 0x000000, 0.01).setScrollFactor(0).setInteractive({ useHandCursor: true });
    dhit.on('pointerdown', () => { if (this.mode === 'dialogue') this.advanceDialogue(); });
    this.dlg.add([dbg, this.dlgSpeaker, this.dlgBody, this.dlgHint, dhit]);
    this.dlg.setScrollFactor(0, 0, true);
  }

  returnToCampaignMenu() {
    soundManager.playPaperRustle();
    soundManager.stopWindAmbient();
    this.cameras.main.fadeOut(450, 0, 0, 0);
    this.time.delayedCall(480, () => {
      this.scene.start('CampaignScene');
    });
  }

  updateHUD() {
    const era = ERAS[this.state.era];
    const have = this.evidenceCount();
    this.eraTitleTxt.setText(`${era.year} — ${era.title}`);
    this.eraObjTxt.setText(have >= EVIDENCE_PER_ERA
      ? 'All evidence collected! Head to the Chronicle Table in the Central Hub to leave your Memorandum.'
      : era.objective);
    this.evTxt.setText(`EVIDENCE: ${have}/${EVIDENCE_PER_ERA}   •   ERA ${this.state.era + 1}/${ERAS.length}`);

    // Side mission status line (Idea 4)
    const entry = this.missions ? this.missions.find(e => e.def.era === this.state.era) : null;
    if (entry) {
      const m = entry.def;
      if (this.state.missions[m.id]) {
        this.misTxt.setText(`★ Mission "${m.title}": COMPLETED`).setColor('#7ABF5A');
      } else if (this.missionRt[m.id]) {
        let extra = 'in progress';
        if (m.type === 'plant') {
          const cnt = entry.spots.filter(s => s.planted).length;
          extra = `planted ${cnt}/${entry.spots.length}`;
        } else if (m.type === 'carry') {
          extra = this.carrying === m.id ? 'deliver to destination [E]' : 'pick up water barrel at hydrological station';
        } else if (m.type === 'escort') {
          extra = 'lead to the evacuation point';
        }
        this.misTxt.setText(`★ Mission: ${m.title} (${extra})`).setColor('#6FB4C4');
      } else {
        this.misTxt.setText(`★ Community Mission: ${m.title} — speak with ${m.giver.name}`).setColor('#C4A46C');
      }
    } else {
      this.misTxt.setText('');
    }

    // Dynamic vertical stacking inside left panel so texts never overlap
    this.eraTitleTxt.setY(20);
    this.eraObjTxt.setY(this.eraTitleTxt.y + this.eraTitleTxt.height + 5);
    this.evTxt.setY(this.eraObjTxt.y + this.eraObjTxt.height + 7);
    this.misTxt.setY(this.evTxt.y + this.evTxt.height + 5);

    const contentBottom = this.misTxt.text
      ? this.misTxt.y + this.misTxt.height
      : this.evTxt.y + this.evTxt.height;
    const leftPanelH = Math.max(128, contentBottom - 12 + 12);
    if (this.leftPanelGfx) {
      this.leftPanelGfx.clear();
      this.leftPanelGfx.fillStyle(0x1A0E06, 0.88);
      this.leftPanelGfx.fillRoundedRect(12, 12, 422, leftPanelH, 10);
      this.leftPanelGfx.lineStyle(1.5, 0xC4A46C, 0.65);
      this.leftPanelGfx.strokeRoundedRect(12, 12, 422, leftPanelH, 10);
    }

    const w = this.cameras.main.width;
    const g = this.meterGfx;
    g.clear();
    this.meterDefs.forEach(md => {
      const v = Phaser.Math.Clamp(this.state.stats[md.key], 0, 100);
      g.fillStyle(0x3A2A18, 1); g.fillRect(w - 156, md.y, 100, 10);
      g.fillStyle(md.color, 1); g.fillRect(w - 156, md.y, v, 10);
      g.lineStyle(1, 0x8B7355, 0.8); g.strokeRect(w - 156, md.y, 100, 10);
      md.valTxt.setText(String(Math.round(v)));
    });
  }

  showFloatingNotice(msg, duration = 3400) {
    if (this.notice) { this.notice.destroy(); this.notice = null; }
    const w = this.cameras.main.width;
    const t = this.add.text(w / 2, 186, msg, {
      fontFamily: FONT_B, fontSize: '14px', color: '#FFE8C0', align: 'center',
      wordWrap: { width: 660 }, backgroundColor: 'rgba(26,14,6,0.92)', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(120).setAlpha(0);
    this.notice = t;
    this.tweens.add({ targets: t, alpha: 1, duration: 220 });
    this.time.delayedCall(duration, () => {
      if (!t.scene) return;
      this.tweens.add({
        targets: t, alpha: 0, duration: 380,
        onComplete: () => { if (t.scene) t.destroy(); if (this.notice === t) this.notice = null; },
      });
    });
  }

  // ==================== INPUT ====================
  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.input.keyboard.addCapture('TAB,SPACE,UP,DOWN,LEFT,RIGHT');
    this.input.keyboard.on('keydown', this.onKeyDown, this);
    this.events.once('shutdown', () => {
      soundManager.stopWindAmbient();
      try {
        this.input.keyboard.off('keydown', this.onKeyDown, this);
        this.input.keyboard.removeCapture('TAB,SPACE,UP,DOWN,LEFT,RIGHT');
      } catch (e) {}
    });
  }

  onKeyDown(e) {
    const k = e.code;
    const advance = k === 'Space' || k === 'Enter' || k === 'KeyE';
    if (this.mode === 'dialogue') { if (advance) this.advanceDialogue(); return; }
    if (this.mode === 'card') { if (advance && this.cardAdvance) this.cardAdvance(); return; }
    if (this.mode === 'modal') { if (this.modalKey) this.modalKey(e); return; }
    if (this.mode !== 'play') return;
    if (k === 'KeyE') this.interact();
    else if (k === 'KeyR') {
      this.radarOn = !this.radarOn;
      soundManager.playTone(this.radarOn ? 740 : 420, 0.08, 'sine', 0.08);
      this.showFloatingNotice(this.radarOn ? 'Chronoscope Direction Finder ON [R]' : 'Direction Finder switched to silent mode [R]', 1800);
    }
    else if (k === 'Tab') this.openJournal();
    else if (k === 'KeyM') soundManager.toggleMute();
    else if (k === 'Escape') this.returnToCampaignMenu();
  }

  // ==================== UPDATE ====================
  update(time, delta) {
    if (!this.player) return;

    if (this.borderNoticeCooldown > 0) this.borderNoticeCooldown -= delta;
    if (this.doseWarnCooldown > 0) this.doseWarnCooldown -= delta;

    if (this.mode !== 'play') {
      this.player.setVelocity(0, 0);
      this.promptTxt.setVisible(false);
      this.geigerBox.setVisible(false);
      this.playerShadow.setPosition(this.player.x, this.player.y + 14);
      if (this.carryIcon) this.carryIcon.setPosition(this.player.x, this.player.y - 34);
      return;
    }

    // Movement (carrying heavy water barrel slightly slows movement)
    const speed = this.carrying ? 168 : 215;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -1;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -1;
    else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = 1;
    if (vx && vy) { vx *= 0.7071; vy *= 0.7071; }
    this.player.setVelocity(vx * speed, vy * speed);
    if (vx < 0) this.player.setFlipX(true);
    else if (vx > 0) this.player.setFlipX(false);

    // Enforce Era-based Zone Locks & Water/Crater Boundaries
    this.enforceZoneAndTerrainBounds();

    this.playerShadow.setPosition(this.player.x, this.player.y + 14);
    if (this.carryIcon) {
      this.carryIcon.setVisible(!!this.carrying);
      this.carryIcon.setPosition(this.player.x, this.player.y - 34);
    }

    if (vx || vy) {
      this.stepTimer -= delta;
      if (this.stepTimer <= 0) { soundManager.playFootstep(); this.stepTimer = 300; }
    }

    this.updateRadiationAndCloud(time, delta);
    this.updateMissions(delta);
    this.updatePrompt();
    this.updateRadar(time, delta);
  }

  enforceZoneAndTerrainBounds() {
    const era = ERAS[this.state.era];
    const az = era.allowedZones;

    // 1. Check West/East Era Checkpoint Locks
    if (az) {
      if (this.player.x < az.minX) {
        this.player.x = az.minX + 6;
        this.player.body.setVelocityX(0);
        if (this.borderNoticeCooldown <= 0 && az.westBlockedMsg) {
          this.borderNoticeCooldown = 2600;
          this.showFloatingNotice(az.westBlockedMsg, 3400);
        }
      } else if (this.player.x > az.maxX) {
        this.player.x = az.maxX - 6;
        this.player.body.setVelocityX(0);
        if (this.borderNoticeCooldown <= 0 && az.eastBlockedMsg) {
          this.borderNoticeCooldown = 2600;
          this.showFloatingNotice(az.eastBlockedMsg, 3400);
        }
      }
    }

    // 2. Prevent walking into deep Aral Sea water (except along the wooden pier 680..865, y: 760..800)
    const onPier = this.player.x >= 680 && this.player.x <= 870 && this.player.y >= 758 && this.player.y <= 802;
    if (!onPier && this.aralShore && this.aralRy) {
      const waterRx = Math.max(40, this.aralShore - 32);
      const waterRy = Math.max(40, this.aralRy - 28);
      const dy = this.player.y - 800;
      const norm = (this.player.x / waterRx) ** 2 + (dy / waterRy) ** 2;
      if (norm < 1) {
        const safeX = waterRx * Math.sqrt(Math.max(0, 1 - (dy / waterRy) ** 2)) + 4;
        this.player.x = Math.max(this.player.x, safeX);
        this.player.body.setVelocityX(0);
        if (this.borderNoticeCooldown <= 0) {
          this.borderNoticeCooldown = 2400;
          this.showFloatingNotice('⚠ Deep waters of the Aral Sea. Walk along the shoreline or use the wooden pier.', 2800);
        }
      }
    }

    // 3. Prevent walking into the center of the Ground Zero atomic crater (3220, 480)
    const cdx = (this.player.x - 3220) / 145;
    const cdy = (this.player.y - 480) / 90;
    if (cdx * cdx + cdy * cdy < 1) {
      const ang = Math.atan2(cdy, cdx);
      this.player.x = 3220 + Math.cos(ang) * 150;
      this.player.y = 480 + Math.sin(ang) * 94;
      if (this.borderNoticeCooldown <= 0) {
        this.borderNoticeCooldown = 2400;
        this.showFloatingNotice('⚠ Nuclear Ground Zero crater! Extreme contamination — stay outside the crater rim.', 3000);
      }
    }
  }

  // ==================== IDEA 1: RADIATION, SUIT & FALLOUT STORMS ====================
  resetCloud() {
    if (this.cloudGfx) this.cloudGfx.clear();
    if (this.hasCloudEra()) {
      this.cloud = { phase: 'cooldown', timer: 18000, x: 3500, maxX: 3500, halfW: 180 };
    } else {
      this.cloud = { phase: 'idle', timer: 0, x: 0, maxX: 0, halfW: 180 };
    }
  }

  updateRadiationAndCloud(time, delta) {
    const dt = delta / 1000;
    const px = this.player.x, py = this.player.y;
    const inPolygon = px > this.eastBorderX - 40;

    // Check if inside a shelter
    let shelter = null;
    for (const sh of SHELTERS) {
      if (Phaser.Math.Distance.Between(px, py, sh.x, sh.y) <= SHELTER_R) {
        shelter = sh;
        break;
      }
    }
    this.inShelter = !!shelter;

    // Update Fallout Cloud in eras 1949 & 1989
    const c = this.cloud;
    this.cloudGfx.clear();
    let inCloud = false;
    if (this.hasCloudEra()) {
      if (c.phase === 'cooldown') {
        c.timer -= delta;
        if (c.timer <= 0) {
          c.phase = 'warn';
          c.timer = 6000;
          soundManager.playSiren();
          this.showFloatingNotice('☢ WARNING: Radioactive release in 6 sec! Take cover in a tent, bunker, or medical post!', 5200);
        }
      } else if (c.phase === 'warn') {
        c.timer -= delta;
        if (c.timer <= 0) {
          c.phase = 'active';
          c.x = 3480;
          c.maxX = 2280;
          soundManager.playSiren();
        }
      } else if (c.phase === 'active') {
        c.x -= 130 * dt;
        // Draw radioactive cloud wave across Polygon
        this.cloudGfx.fillStyle(0xA8E030, 0.22);
        this.cloudGfx.fillRect(c.x - c.halfW, 0, c.halfW * 2, this.H);
        this.cloudGfx.fillStyle(0xF0C020, 0.14);
        this.cloudGfx.fillRect(c.x - c.halfW * 0.6, 0, c.halfW * 1.2, this.H);
        if (Math.abs(px - c.x) < c.halfW) inCloud = true;
        if (c.x < c.maxX) {
          c.phase = 'cooldown';
          c.timer = 25000;
        }
      }
    }

    // Compute hotspot intensity
    let intensity = 0;
    if (inPolygon) {
      HOTSPOTS.forEach(hs => {
        const d = Phaser.Math.Distance.Between(px, py, hs.x, hs.y);
        if (d < hs.r) intensity = Math.max(intensity, 1 - d / hs.r);
      });
    }
    if (inCloud) intensity = Math.max(intensity, 0.95);

    // Dose & Suit changes
    if (this.inShelter) {
      this.dose = Math.max(0, this.dose - 18 * dt);
    } else if (intensity > 0.02 || inCloud) {
      const hasSuit = this.state.suit && this.suitHP > 0;
      const mult = hasSuit ? 0.22 : 1.0;
      const rate = (intensity * 15 + (inCloud ? 26 : 0)) * mult;
      this.dose = Math.min(100, this.dose + rate * dt);
      if (hasSuit) {
        this.suitHP = Math.max(0, this.suitHP - (intensity * 4.5 + (inCloud ? 9 : 0)) * dt);
        if (this.suitHP <= 0) {
          this.player.setTexture('eco_player');
          this.showFloatingNotice('⚠ Hazmat suit worn out! Repair or replace it at the Equipment Depot in the Hub.', 3500);
        }
      } else if (this.dose > 35 && this.doseWarnCooldown <= 0) {
        this.doseWarnCooldown = 9000;
        this.showFloatingNotice('☢ Radiation rising! Pick up an OZK Hazmat Suit at the Equipment Depot in the Hub.', 3600);
      }
    } else {
      this.dose = Math.max(0, this.dose - 4 * dt);
    }

    // Critical dose penalty -> emergency evacuation to Medical Post
    if (this.dose >= 100) {
      this.dose = 25;
      this.state.stats.health = Math.max(0, (this.state.stats.health || 0) - 5);
      this.saveState();
      soundManager.playFailBuzz();
      this.cameras.main.shake(300, 0.01);
      this.player.setPosition(1680, 930);
      this.player.setVelocity(0, 0);
      this.updateHUD();
      this.showFloatingNotice('☢ CRITICAL RADIATION DOSE! Emergency evacuation to Field Medical Post for decontamination (−5 Public Health).', 4800);
    }

    // Geiger counter UI & clicks
    const showGeiger = inPolygon || this.dose > 1 || c.phase === 'warn' || c.phase === 'active';
    this.geigerBox.setVisible(showGeiger);
    if (showGeiger) {
      const damp = 1 - this.state.stats.health / 250;
      const usv = 0.12 + intensity * intensity * 95 * damp;
      this.geigerVal.setText(`${usv.toFixed(1)} µSv/h`);
      this.geigerVal.setColor(intensity > 0.6 ? '#E05040' : (intensity > 0.2 ? '#F0C020' : '#7ABF5A'));

      this.geigerTimer -= delta;
      if (this.geigerTimer <= 0) {
        const interval = intensity > 0 ? Phaser.Math.Linear(650, 65, intensity) : 1400;
        this.geigerTimer = interval * Phaser.Math.FloatBetween(0.5, 1.5);
        soundManager.playGeigerClick(0.04 + 0.1 * intensity);
      }
    }

    // Draw top-center Radiation / Suit / Shelter status bar
    this.drawRadiationHUD(shelter);
  }

  drawRadiationHUD(shelter) {
    const g = this.radGfx;
    g.clear();

    const showBar = this.hasCloudEra() || this.dose > 1 || this.state.suit;
    this.radBox.setVisible(showBar);
    if (!showBar) return;

    // Non-overlapping slot between left panel (12..434) and right panel (756..1012)
    const bx = 444, by = 12, bw = 300, bh = 104;
    g.fillStyle(0x1A0E06, 0.88);
    g.fillRoundedRect(bx, by, bw, bh, 10);
    const borderCol = this.cloud.phase === 'active' ? 0xE05040 : (this.cloud.phase === 'warn' ? 0xF0C020 : 0x8B7355);
    g.lineStyle(1.5, borderCol, 0.85);
    g.strokeRoundedRect(bx, by, bw, bh, 10);

    let title = '☢ RADIATION CONTROL';
    let titleCol = '#FFD700';
    if (this.inShelter && shelter) {
      const shLabel = (shelter.label || shelter.name || 'Field Tent').toUpperCase();
      title = `🛡 SHELTERED: ${shLabel}`;
      titleCol = '#7ABF5A';
    } else if (this.cloud.phase === 'warn') {
      title = `⚠ FALLOUT IN ${Math.ceil(this.cloud.timer / 1000)}S — TAKE COVER!`;
      titleCol = '#F0C020';
    } else if (this.cloud.phase === 'active') {
      title = '☢ FALLOUT WAVE ACTIVE!';
      titleCol = '#E05040';
    }
    this.radTitle.setText(title).setColor(titleCol);

    // Row 1: Dose bar (y = 48)
    const barX = 526, barW = 158, barH = 10;
    const doseY = 48;
    g.fillStyle(0x3A2A18, 1); g.fillRect(barX, doseY, barW, barH);
    const dCol = this.dose > 70 ? 0xE05040 : (this.dose > 35 ? 0xF0C020 : 0x7ABF5A);
    g.fillStyle(dCol, 1); g.fillRect(barX, doseY, (this.dose / 100) * barW, barH);
    g.lineStyle(1, 0x8B7355, 0.8); g.strokeRect(barX, doseY, barW, barH);
    if (this.radDoseVal) {
      this.radDoseVal.setText(`${Math.round(this.dose)}%`);
      this.radDoseVal.setColor(this.dose > 70 ? '#FF8080' : '#FFE8C0');
    }

    // Row 2: Hazmat Suit bar (y = 72)
    const suitY = 72;
    const suitPct = this.state.suit ? this.suitHP : 0;
    g.fillStyle(0x3A2A18, 1); g.fillRect(barX, suitY, barW, barH);
    g.fillStyle(0x6FB4C4, 1); g.fillRect(barX, suitY, (suitPct / 100) * barW, barH);
    g.lineStyle(1, 0x8B7355, 0.8); g.strokeRect(barX, suitY, barW, barH);
    if (this.radSuitVal) {
      this.radSuitVal.setText(this.state.suit ? `${Math.round(this.suitHP)}%` : 'NONE');
      this.radSuitVal.setColor(this.state.suit && this.suitHP > 0 ? '#6FB4C4' : '#A0896C');
    }

    // Row 3: Clear status footer (y = 98)
    let subTxt = 'Get OZK Suit at Hub Equipment Depot';
    if (this.inShelter) {
      subTxt = 'Inside shelter — radiation dose decreasing';
    } else if (this.state.suit && this.suitHP > 0) {
      subTxt = 'OZK Hazmat Suit active (−78% radiation)';
    }
    this.radSub.setText(subTxt);
  }

  // ==================== IDEA 4: LIVING SIDE MISSIONS ====================
  updateMissions(delta) {
    const dt = delta / 1000;
    this.missions.forEach(entry => {
      const m = entry.def;
      if (m.era !== this.state.era || this.state.missions[m.id] || !this.missionRt[m.id]) return;

      if (m.type === 'escort') {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, entry.sprite.x, entry.sprite.y);
        // Follow player when within 320px
        if (d > 48 && d < 320) {
          const ang = Phaser.Math.Angle.Between(entry.sprite.x, entry.sprite.y, this.player.x, this.player.y);
          const spd = 165;
          entry.sprite.x += Math.cos(ang) * spd * dt;
          entry.sprite.y += Math.sin(ang) * spd * dt;
          entry.label.setPosition(entry.sprite.x, entry.sprite.y - 46);
          entry.mark.setPosition(entry.sprite.x, entry.sprite.y - 66);
        }
        // Check if reached goal
        if (entry.goal) {
          const gd = Phaser.Math.Distance.Between(entry.sprite.x, entry.sprite.y, entry.goal.x, entry.goal.y);
          if (gd <= (entry.goal.r || 60)) {
            this.completeMission(entry);
          }
        }
      }
    });
  }

  completeMission(entry) {
    const m = entry.def;
    if (this.state.missions[m.id]) return;
    this.state.missions[m.id] = true;
    this.carrying = null;
    if (this.carryIcon) this.carryIcon.setVisible(false);

    const parts = [];
    if (m.reward) {
      Object.keys(m.reward).forEach(k => {
        this.state.stats[k] = Phaser.Math.Clamp((this.state.stats[k] || 0) + m.reward[k], 0, 100);
        parts.push(`${STAT_NAMES[k] || k} +${m.reward[k]}`);
      });
    }
    this.saveState();
    soundManager.playVictoryFanfare();
    this.refreshAll();
    const doneLines = m.done || m.doneLines || [];
    this.startDialogue(doneLines, () => {
      this.showFloatingNotice(`★ Mission "${m.title}" completed! (${parts.join(', ')})`, 4800);
    });
  }

  // ==================== IDEA 5: FIELD RADAR / DIRECTION FINDER ====================
  updateRadar(time, delta) {
    const h = this.cameras.main.height;
    const cx = 82, cy = h - 114, r = 50;
    const g = this.radarGfx;
    g.clear();

    // Background housing panel so world labels never clash with radar text
    g.fillStyle(0x1A0E06, 0.88);
    g.fillRoundedRect(12, h - 196, 140, 162, 10);
    g.lineStyle(1.5, 0x8B7355, 0.65);
    g.strokeRoundedRect(12, h - 196, 140, 162, 10);

    g.fillStyle(0x121A10, 0.94);
    g.fillCircle(cx, cy, r);
    g.lineStyle(2, this.radarOn ? 0x7ABF5A : 0x5A6A52, 0.85);
    g.strokeCircle(cx, cy, r);
    g.lineStyle(1, 0x7ABF5A, 0.25);
    g.strokeCircle(cx, cy, r * 0.55);
    g.lineBetween(cx - r, cy, cx + r, cy);
    g.lineBetween(cx, cy - r, cx, cy + r);

    if (!this.radarOn) {
      this.radarDistTxt.setText('OFF [R]');
      return;
    }

    // Rotating sweep line
    const sweep = (time * 0.0026) % (Math.PI * 2);
    g.lineStyle(1.5, 0x7ABF5A, 0.7);
    g.lineBetween(cx, cy, cx + Math.cos(sweep) * r, cy + Math.sin(sweep) * r);

    // Collect radar blips: primary objectives (gold), side mission targets (cyan), shelters during warning (green)
    const blips = [];
    let nearestD = Infinity;

    this.interactables.forEach(it => {
      const o = it.def;
      if (!this.isActive(o)) return;
      if (o.evidenceId && !this.state.found.includes(o.evidenceId)) {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, o.x, o.y);
        blips.push({ x: o.x, y: o.y, color: 0xFFD700, size: 4 });
        if (d < nearestD) nearestD = d;
      } else if (o.council && this.evidenceCount() >= EVIDENCE_PER_ERA) {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, o.x, o.y);
        blips.push({ x: o.x, y: o.y, color: 0xFFD700, size: 5 });
        if (d < nearestD) nearestD = d;
      }
    });

    this.missions.forEach(entry => {
      const m = entry.def;
      if (m.era !== this.state.era || this.state.missions[m.id]) return;
      if (!this.missionRt[m.id]) {
        blips.push({ x: m.giver.x, y: m.giver.y, color: 0x6FB4C4, size: 3.5 });
      } else if (m.type === 'carry' && this.carrying !== m.id && m.pickup) {
        blips.push({ x: m.pickup.x, y: m.pickup.y, color: 0x6FB4C4, size: 4 });
      } else if (entry.goal) {
        blips.push({ x: entry.goal.x, y: entry.goal.y, color: 0x6FB4C4, size: 4 });
      } else if (entry.spots && entry.spots.length) {
        entry.spots.filter(s => !s.planted).forEach(s => blips.push({ x: s.x, y: s.y, color: 0x6FB4C4, size: 3.5 }));
      }
    });

    if (this.cloud.phase === 'warn' || this.cloud.phase === 'active') {
      SHELTERS.forEach(sh => blips.push({ x: sh.x, y: sh.y, color: 0x7ABF5A, size: 3.5 }));
    }

    blips.forEach(b => {
      const dx = b.x - this.player.x;
      const dy = b.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      const nr = Math.min(1, dist / RADAR_RANGE) * (r - 6);
      g.fillStyle(b.color, 0.95);
      g.fillCircle(cx + Math.cos(ang) * nr, cy + Math.sin(ang) * nr, b.size);
    });

    // Player center dot
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(cx, cy, 2.5);

    if (nearestD < Infinity) {
      const meters = Math.max(5, Math.round(nearestD / 4));
      this.radarDistTxt.setText(`Target: ~${meters} m`);
      this.radarTimer -= delta;
      if (this.radarTimer <= 0) {
        const proximity = 1 - Phaser.Math.Clamp(nearestD / 1400, 0, 1);
        this.radarTimer = Phaser.Math.Linear(2400, 520, proximity);
        soundManager.playRadarPing(proximity);
      }
    } else {
      this.radarDistTxt.setText('Clear');
    }
  }

  // ==================== INTERACTION ====================
  nearestInteractable() {
    let best = null;
    let bestD = 92;

    // 1. Check standard interactables
    this.interactables.forEach(it => {
      if (!this.isActive(it.def)) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, it.def.x, it.def.y);
      if (d < bestD) { best = { kind: 'obj', it }; bestD = d; }
    });

    // 2. Check active era side missions (givers, pickups, goals, planting spots)
    this.missions.forEach(entry => {
      const m = entry.def;
      if (m.era !== this.state.era) return;
      const done = !!this.state.missions[m.id];
      const started = !!this.missionRt[m.id];

      if (!done && started && m.type === 'carry') {
        if (this.carrying !== m.id && entry.pickup) {
          const pd = Phaser.Math.Distance.Between(this.player.x, this.player.y, m.pickup.x, m.pickup.y);
          if (pd < bestD) { best = { kind: 'pickup', entry }; bestD = pd; }
        } else if (this.carrying === m.id && entry.goal) {
          const gd = Phaser.Math.Distance.Between(this.player.x, this.player.y, entry.goal.x, entry.goal.y);
          if (gd < bestD + 20) { best = { kind: 'deliver', entry }; bestD = gd; }
        }
      }

      if (!done && started && m.type === 'plant') {
        entry.spots.forEach(sp => {
          if (sp.planted) return;
          const sd = Phaser.Math.Distance.Between(this.player.x, this.player.y, sp.x, sp.y);
          if (sd < bestD) { best = { kind: 'plant', entry, spot: sp }; bestD = sd; }
        });
      }

      const gd = Phaser.Math.Distance.Between(this.player.x, this.player.y, entry.sprite.x, entry.sprite.y);
      if (gd < bestD) { best = { kind: 'mission', entry }; bestD = gd; }
    });

    return best;
  }

  updatePrompt() {
    const target = this.nearestInteractable();
    if (!target) { this.promptTxt.setVisible(false); return; }

    let txt = '';
    if (target.kind === 'obj') {
      const o = target.it.def;
      if (o.council) {
        const have = this.evidenceCount();
        txt = have >= EVIDENCE_PER_ERA ? '[E] Leave Memorandum' : `[E] Chronicle Table (Evidence ${have}/${EVIDENCE_PER_ERA})`;
      } else if (this.isSuitObj(o)) {
        txt = this.state.suit ? '[E] Repair / Refresh Hazmat Suit' : '[E] Equip OZK Hazmat Suit';
      } else if (this.isDeconObj(o)) {
        txt = `[E] Decontaminate (Dose ${Math.round(this.dose)}%)`;
      } else if (o.evidenceId && !this.state.found.includes(o.evidenceId)) {
        txt = o.minigame ? `[E] ${o.name} (Mini-Game)` : `[E] ${o.name}`;
      } else {
        txt = `[E] ${o.name} (Examined)`;
      }
    } else if (target.kind === 'mission') {
      const m = target.entry.def;
      const done = !!this.state.missions[m.id];
      txt = done ? `[E] ${m.giver.name} (Completed)` : `[E] ★ ${m.giver.name}: ${m.title}`;
    } else if (target.kind === 'pickup') {
      txt = `[E] Pick up: ${target.entry.def.pickup.item || target.entry.def.pickup.name}`;
    } else if (target.kind === 'deliver') {
      const gName = (target.entry.goal && (target.entry.goal.label || target.entry.goal.name)) || target.entry.def.giver.name;
      txt = `[E] Deliver water: ${gName}`;
    } else if (target.kind === 'plant') {
      txt = `[E] Plant saxaul sapling (#${target.spot.idx + 1})`;
    }

    this.promptTxt.setText(txt).setVisible(true);
  }

  interact() {
    const target = this.nearestInteractable();
    if (!target) return;
    soundManager.playPaperRustle();

    if (target.kind === 'pickup') {
      const entry = target.entry;
      const m = entry.def;
      this.carrying = m.id;
      soundManager.playClueChime();
      this.refreshAll();
      const gName = (entry.goal && (entry.goal.label || entry.goal.name)) || m.giver.name;
      if (m.pickupLines && m.pickupLines.length) {
        this.startDialogue(m.pickupLines, () => {
          this.showFloatingNotice(`Deliver the water barrel to: ${gName}!`, 3500);
        });
      } else {
        this.showFloatingNotice(`You picked up the water barrel. Deliver it to: ${gName}!`, 3500);
      }
      return;
    }

    if (target.kind === 'deliver') {
      this.completeMission(target.entry);
      return;
    }

    if (target.kind === 'plant') {
      target.spot.planted = true;
      soundManager.playClueChime();
      this.refreshAll();
      const entry = target.entry;
      const plantedCount = entry.spots.filter(s => s.planted).length;
      if (plantedCount >= entry.spots.length) {
        this.completeMission(entry);
      } else {
        this.showFloatingNotice(`Saxaul sapling planted (${plantedCount}/${entry.spots.length})!`, 2600);
      }
      return;
    }

    if (target.kind === 'mission') {
      const entry = target.entry;
      const m = entry.def;
      const startLines = m.intro || m.startLines || [];
      const doneLines = m.done || m.doneLines || [];
      const waitLines = m.waitLine ? [{ speaker: m.giver.name, text: m.waitLine }] : startLines;
      if (this.state.missions[m.id]) {
        this.startDialogue(doneLines);
      } else if (!this.missionRt[m.id]) {
        this.startDialogue(startLines, () => {
          this.missionRt[m.id] = true;
          soundManager.playClueChime();
          this.refreshAll();
          this.showFloatingNotice(`★ Mission started: "${m.title}"`, 3500);
        });
      } else {
        this.startDialogue(waitLines);
      }
      return;
    }

    const o = target.it.def;
    if (o.council) { this.handleCouncil(); return; }

    if (this.isSuitObj(o)) {
      this.state.suit = true;
      this.suitHP = 100;
      this.saveState();
      soundManager.playClueChime();
      this.refreshAll();
      const suitLines = (o.lines && o.lines.length) ? o.lines : [
        { speaker: 'Equipment Depot', text: 'You put on the OZK protective hazmat suit and check the respirator valve. The suit reduces radiation exposure by 78%.' },
      ];
      this.startDialogue(suitLines, () => {
        this.showFloatingNotice('OZK Hazmat Suit equipped (100% durability). Radiation protection +78%!', 3600);
      });
      return;
    }

    if (this.isDeconObj(o)) {
      this.dose = 0;
      soundManager.playClueChime();
      this.refreshAll();
      const deconLines = (o.lines && o.lines.length) ? o.lines : [
        { speaker: 'Decontamination Station', text: 'You undergo chemical washdown and replace your respirator filters. Accumulated radiation dose reset to zero.' },
      ];
      this.startDialogue(deconLines, () => {
        this.showFloatingNotice('Decontamination complete! Accumulated radiation dose reduced to 0%.', 3200);
      });
      return;
    }

    const done = o.evidenceId && this.state.found.includes(o.evidenceId);
    if (done) {
      const txt = o.repeat || 'This piece of evidence has already been recorded in your journal.';
      this.startDialogue([{ speaker: o.name, text: txt }]);
    } else if (o.minigame) {
      // Idea 3: Launch interactive mini-game after dialogue
      this.startDialogue(o.lines, () => this.launchMiniGame(o));
    } else {
      this.startDialogue(o.lines, () => this.collectEvidence(o.evidenceId));
    }
  }

  launchMiniGame(o) {
    this.mode = 'modal';
    this.player.setVelocity(0, 0);
    this.promptTxt.setVisible(false);
    this.scene.launch('EcoMiniGameScene', {
      type: o.minigame,
      title: o.name,
      onDone: (res) => {
        this.mode = 'play';
        if (res && res.cancelled) return;
        let bonusMsg = '';
        if (res && res.success && o.bonus) {
          const parts = [];
          Object.keys(o.bonus).forEach(k => {
            this.state.stats[k] = Phaser.Math.Clamp((this.state.stats[k] || 0) + o.bonus[k], 0, 100);
            parts.push(`${STAT_NAMES[k] || k} +${o.bonus[k]}`);
          });
          bonusMsg = ` Mastery bonus: ${parts.join(', ')}!`;
        }
        this.collectEvidence(o.evidenceId, bonusMsg);
      },
    });
  }

  collectEvidence(id, bonusMsg = '') {
    if (!id || this.state.found.includes(id)) return;
    this.state.found.push(id);
    this.saveState();
    soundManager.playClueChime();
    const ev = ECO_EVIDENCE.find(e => e.id === id);
    const have = this.evidenceCount();
    this.refreshAll();
    if (have >= EVIDENCE_PER_ERA) {
      this.showFloatingNotice(`Evidence: "${ev ? ev.title : id}" (${have}/${EVIDENCE_PER_ERA}).${bonusMsg} All evidence gathered — head to the Chronicle Table in the Hub!`, 5200);
    } else {
      this.showFloatingNotice(`Evidence: "${ev ? ev.title : id}" (${have}/${EVIDENCE_PER_ERA}).${bonusMsg}`, 4200);
    }
  }

  handleCouncil() {
    const have = this.evidenceCount();
    if (have < EVIDENCE_PER_ERA) {
      this.startDialogue([{
        speaker: 'Chronicle Table',
        text: `The Memorandum is not ready yet. Evidence collected: ${have}/${EVIDENCE_PER_ERA}. Gather all evidence for this era — use the Direction Finder in the bottom-left corner of the screen.`,
      }]);
    } else {
      this.openDecision();
    }
  }

  // ==================== DIALOGUE ====================
  startDialogue(lines, onDone) {
    if (!lines || !lines.length) { if (onDone) onDone(); return; }
    this.mode = 'dialogue';
    this.dialogue = { lines, idx: 0, onDone };
    this.promptTxt.setVisible(false);
    this.showDialogueLine();
  }

  showDialogueLine() {
    const d = this.dialogue;
    const line = d.lines[d.idx];
    this.dlgSpeaker.setText((line.speaker || '').toUpperCase());
    this.dlgBody.setText(line.text || '');
    this.dlg.setVisible(true);
  }

  advanceDialogue() {
    const d = this.dialogue;
    if (!d) return;
    soundManager.playPaperRustle();
    d.idx++;
    if (d.idx >= d.lines.length) {
      this.dlg.setVisible(false);
      this.dialogue = null;
      this.mode = 'play';
      if (d.onDone) d.onDone();
    } else {
      this.showDialogueLine();
    }
  }

  // ==================== CARDS / MODALS ====================
  showEraIntro(idx, withPremise) {
    const era = ERAS[idx];
    const insight = ERA_INSIGHTS[idx] || null;
    this.showCard(era.year, era.title, era.sub, insight && insight.epigraph, () => {
      const lines = withPremise ? [...ECO_INTRO, ...era.intro] : era.intro;
      this.startDialogue(lines, () => this.showFloatingNotice(era.objective, 6000));
    });
  }

  showCard(year, title, sub, epigraph, onDone) {
    if (typeof epigraph === 'function') { onDone = epigraph; epigraph = null; }
    this.mode = 'card';
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const c = this.add.container(0, 0).setDepth(200).setScrollFactor(0).setAlpha(0);
    const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.94).setScrollFactor(0).setInteractive();
    const y = this.add.text(w / 2, h / 2 - 140, year, {
      fontFamily: FONT_H, fontSize: '92px', color: '#FFD700', stroke: '#2A1506', strokeThickness: 5, letterSpacing: 8,
    }).setOrigin(0.5);
    const t = this.add.text(w / 2, h / 2 - 52, title, {
      fontFamily: FONT_H, fontSize: '23px', color: '#FFE8C0', letterSpacing: 3, align: 'center', wordWrap: { width: w - 120 },
    }).setOrigin(0.5);
    const s = this.add.text(w / 2, h / 2 - 10, sub, {
      fontFamily: FONT_B, fontSize: '16px', color: '#A0896C', fontStyle: 'italic',
    }).setOrigin(0.5);
    c.add([bg, y, t, s]);

    // Idea 6: Primary-source epigraph box on the era card
    if (epigraph && epigraph.text) {
      const eBox = this.add.graphics();
      eBox.fillStyle(0x231206, 0.9);
      eBox.fillRoundedRect(w / 2 - 370, h / 2 + 28, 740, 126, 10);
      eBox.lineStyle(1.5, 0xC4A46C, 0.65);
      eBox.strokeRoundedRect(w / 2 - 370, h / 2 + 28, 740, 126, 10);
      const eKind = this.add.text(w / 2, h / 2 + 46, `◆  ${epigraph.kind || 'HISTORICAL RECORD'}  ◆`, {
        fontFamily: FONT_H, fontSize: '11px', color: '#FFD700', letterSpacing: 2,
      }).setOrigin(0.5);
      const eTxt = this.add.text(w / 2, h / 2 + 86, epigraph.text, {
        fontFamily: FONT_B, fontSize: '13.5px', color: '#F0E4C8', fontStyle: 'italic',
        align: 'center', wordWrap: { width: 690 }, lineSpacing: 3,
      }).setOrigin(0.5);
      const eSrc = this.add.text(w / 2, h / 2 + 134, `— ${epigraph.source || ''}`, {
        fontFamily: FONT_B, fontSize: '11px', color: '#C4A46C',
      }).setOrigin(0.5);
      c.add([eBox, eKind, eTxt, eSrc]);
    }

    const hint = this.add.text(w / 2, h - 68, 'PRESS SPACE TO CONTINUE', {
      fontFamily: FONT_H, fontSize: '12px', color: '#C4A46C', letterSpacing: 2,
    }).setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });
    c.add(hint);
    c.setScrollFactor(0, 0, true);
    this.tweens.add({ targets: c, alpha: 1, duration: 500 });

    let closing = false;
    this.cardAdvance = () => {
      if (closing) return;
      closing = true;
      this.cardAdvance = null;
      this.tweens.add({
        targets: c, alpha: 0, duration: 350,
        onComplete: () => { this.tweens.killTweensOf(hint); c.destroy(); this.mode = 'play'; if (onDone) onDone(); },
      });
    };
    bg.on('pointerdown', () => { if (this.cardAdvance) this.cardAdvance(); });
  }

  closeModal() {
    if (this.modal) { this.modal.destroy(); this.modal = null; }
    this.modalKey = null;
    this.mode = 'play';
  }

  makeModal(panelW, panelH) {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const px = w / 2, py = h / 2;
    const c = this.add.container(0, 0).setDepth(150).setScrollFactor(0);
    const overlay = this.add.rectangle(px, py, w, h, 0x000000, 0.72).setScrollFactor(0).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0x2A1506, 0.98); panel.fillRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    panel.lineStyle(2, 0xC4A46C, 0.85); panel.strokeRoundedRect(px - panelW / 2, py - panelH / 2, panelW, panelH, 14);
    c.add([overlay, panel]);
    c.setScrollFactor(0, 0, true);
    this.modal = c;
    this.mode = 'modal';
    return { c, px, py, w, h };
  }

  openJournal() {
    const { c, px, py } = this.makeModal(860, 640);
    c.add(this.add.text(px, py - 300, '◆  EVIDENCE JOURNAL  ◆', {
      fontFamily: FONT_H, fontSize: '18px', color: '#C4A46C', letterSpacing: 3,
    }).setOrigin(0.5));

    const parts = [];
    for (let i = 0; i <= this.state.era; i++) {
      const items = ECO_EVIDENCE.filter(e => e.era === i && this.state.found.includes(e.id));
      if (!items.length) continue;
      parts.push(`■ ${ERAS[i].year} — ${ERAS[i].title}`);
      items.forEach(e => parts.push(`   • ${e.title}: ${e.text}`));
      parts.push('');
    }
    const body = parts.length ? parts.join('\n') : 'No evidence collected yet. Explore the era and speak with local witnesses.';
    c.add(this.add.text(px - 390, py - 266, body, {
      fontFamily: FONT_B, fontSize: '12px', color: '#E8D5B0', wordWrap: { width: 780 }, lineSpacing: 3,
    }));

    const close = this.add.text(px, py + 296, '[ CLOSE — TAB / ESC ]', {
      fontFamily: FONT_H, fontSize: '13px', color: '#C4A46C', letterSpacing: 2,
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.closeModal());
    c.add(close);
    c.setScrollFactor(0, 0, true);
    this.modalKey = (e) => { if (e.code === 'Tab' || e.code === 'Escape') this.closeModal(); };
  }

  openDecision() {
    const era = ERAS[this.state.era];
    const d = era.decision;
    const insight = ERA_INSIGHTS[this.state.era] || {};
    const { c, px, py } = this.makeModal(920, 680);

    c.add(this.add.text(px, py - 314, `◆  ${d.title}  ◆`, {
      fontFamily: FONT_H, fontSize: '17px', color: '#FFD700', letterSpacing: 2,
    }).setOrigin(0.5));
    c.add(this.add.text(px, py - 288, `${era.year} — ${era.sub}`, {
      fontFamily: FONT_B, fontSize: '12.5px', color: '#A0896C', fontStyle: 'italic',
    }).setOrigin(0.5));

    // Idea 3: "Moscow vs. Steppe" Historical Context & Constraints box
    if (insight.context) {
      const ctxBox = this.add.graphics();
      ctxBox.fillStyle(0x1C0E05, 0.92);
      ctxBox.fillRoundedRect(px - 420, py - 268, 840, 74, 8);
      ctxBox.lineStyle(1, 0xC4A46C, 0.55);
      ctxBox.strokeRoundedRect(px - 420, py - 268, 840, 74, 8);
      const ctxTitle = this.add.text(px - 404, py - 260, 'HISTORICAL CONSTRAINTS (MOSCOW VS. THE STEPPE):', {
        fontFamily: FONT_H, fontSize: '10px', color: '#FFD700', letterSpacing: 1,
      });
      const ctxBody = this.add.text(px - 404, py - 243, insight.context, {
        fontFamily: FONT_B, fontSize: '11.5px', color: '#E8D5B0', wordWrap: { width: 808 }, lineSpacing: 2,
      });
      c.add([ctxBox, ctxTitle, ctxBody]);
    }

    c.add(this.add.text(px, py - 176, d.question, {
      fontFamily: FONT_B, fontSize: '15px', color: '#F0E4C8', align: 'center', wordWrap: { width: 820 },
    }).setOrigin(0.5));

    const ev = ECO_EVIDENCE.filter(e => e.era === this.state.era).map(e => e.title).join('  •  ');
    c.add(this.add.text(px, py - 150, `Evidence: ${ev}`, {
      fontFamily: FONT_B, fontSize: '11px', color: '#7ABF5A', align: 'center', wordWrap: { width: 820 },
    }).setOrigin(0.5));

    const letters = ['A', 'B', 'C'];
    d.options.forEach((opt, i) => {
      const by = py - 126 + i * 132;
      const bw = 840, bh = 120;
      const optInsight = (insight.options && insight.options[i]) || {};
      const bg = this.add.graphics();
      const draw = (hover) => {
        bg.clear();
        bg.fillStyle(hover ? 0x5C3A1E : 0x3D2B1A, 0.96);
        bg.fillRoundedRect(px - bw / 2, by, bw, bh, 10);
        bg.lineStyle(hover ? 2 : 1.5, hover ? 0xFFD700 : 0x8B7355, 0.9);
        bg.strokeRoundedRect(px - bw / 2, by, bw, bh, 10);
      };
      draw(false);
      const t = this.add.text(px - bw / 2 + 18, by + 10, `[${letters[i]}]  ${opt.label}`, {
        fontFamily: FONT_B, fontSize: '14px', color: '#FFE8C0', wordWrap: { width: bw - 36 },
      });
      const moscowTxt = this.add.text(px - bw / 2 + 18, by + 50,
        optInsight.moscow ? `• Center / Moscow: ${optInsight.moscow}` : '', {
          fontFamily: FONT_B, fontSize: '11px', color: '#C4A46C', wordWrap: { width: bw - 36 },
        });
      const steppeTxt = this.add.text(px - bw / 2 + 18, by + 82,
        optInsight.steppe ? `• Steppe / People: ${optInsight.steppe}` : '', {
          fontFamily: FONT_B, fontSize: '11px', color: '#7ABF5A', wordWrap: { width: bw - 36 },
        });
      const hit = this.add.rectangle(px, by + bh / 2, bw, bh, 0x000000, 0.01).setScrollFactor(0).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => draw(true));
      hit.on('pointerout', () => draw(false));
      hit.on('pointerdown', () => this.chooseOption(i));
      c.add([bg, t, moscowTxt, steppeTxt, hit]);
    });

    c.add(this.add.text(px, py + 314, 'Choose: A / B / C  or  1 / 2 / 3  •  ESC — Return', {
      fontFamily: FONT_H, fontSize: '11px', color: '#C4A46C', letterSpacing: 1,
    }).setOrigin(0.5));
    c.setScrollFactor(0, 0, true);

    this.modalKey = (e) => {
      const map = { KeyA: 0, KeyB: 1, KeyC: 2, Digit1: 0, Digit2: 1, Digit3: 2 };
      if (map[e.code] !== undefined) this.chooseOption(map[e.code]);
      else if (e.code === 'Escape') this.closeModal();
    };
  }

  chooseOption(i) {
    if (this.mode !== 'modal') return;
    const era = ERAS[this.state.era];
    const opt = era.decision.options[i];
    if (!opt) return;
    this.closeModal();

    Object.keys(opt.effects).forEach(k => {
      this.state.stats[k] = Phaser.Math.Clamp((this.state.stats[k] || 0) + opt.effects[k], 0, 100);
    });
    this.state.choices.push(i);
    this.saveState();
    this.redrawWorld();
    this.updateHUD();
    if (i === 0) soundManager.playVictoryFanfare();
    else soundManager.playClueChime();

    this.showOutcome(era, opt, i);
  }

  showOutcome(era, opt, choiceIdx = 0) {
    const insight = ERA_INSIGHTS[this.state.era] || {};
    const optInsight = (insight.options && insight.options[choiceIdx]) || {};
    const { c, px, py } = this.makeModal(880, 580);
    c.add(this.add.text(px, py - 254, `◆  OUTCOME: ${opt.verdict.toUpperCase()}  ◆`, {
      fontFamily: FONT_H, fontSize: '16px', color: '#FFD700', letterSpacing: 2, align: 'center', wordWrap: { width: 800 },
    }).setOrigin(0.5));
    c.add(this.add.text(px, py - 196, opt.outcome, {
      fontFamily: FONT_B, fontSize: '14px', color: '#F0E4C8', align: 'center', wordWrap: { width: 800 }, lineSpacing: 4,
    }).setOrigin(0.5));

    // Side-by-side comparison: Real History vs. Your Altered Timeline
    const colW = 398, colH = 210, colY = py - 132;
    const leftX = px - 410, rightX = px + 12;
    const cmpGfx = this.add.graphics();
    cmpGfx.fillStyle(0x1C0E05, 0.92);
    cmpGfx.fillRoundedRect(leftX, colY, colW, colH, 8);
    cmpGfx.fillRoundedRect(rightX, colY, colW, colH, 8);
    cmpGfx.lineStyle(1.5, 0x8B7355, 0.75);
    cmpGfx.strokeRoundedRect(leftX, colY, colW, colH, 8);
    cmpGfx.lineStyle(1.5, 0x7ABF5A, 0.75);
    cmpGfx.strokeRoundedRect(rightX, colY, colW, colH, 8);
    c.add(cmpGfx);

    c.add(this.add.text(leftX + 14, colY + 12, 'WHAT HAPPENED IN REAL HISTORY:', {
      fontFamily: FONT_H, fontSize: '10.5px', color: '#E0B040', letterSpacing: 1,
    }));
    c.add(this.add.text(leftX + 14, colY + 34, insight.realHistory || '', {
      fontFamily: FONT_B, fontSize: '11.5px', color: '#E8D5B0', wordWrap: { width: colW - 28 }, lineSpacing: 3,
    }));

    c.add(this.add.text(rightX + 14, colY + 12, 'YOUR ALTERED TIMELINE & LEGACY:', {
      fontFamily: FONT_H, fontSize: '10.5px', color: '#7ABF5A', letterSpacing: 1,
    }));
    const altParts = [];
    if (optInsight.moscow) altParts.push(`• State: ${optInsight.moscow}`);
    if (optInsight.steppe) altParts.push(`• Steppe: ${optInsight.steppe}`);
    if (optInsight.legacy) altParts.push(`• Memory of the Land: ${optInsight.legacy}`);
    c.add(this.add.text(rightX + 14, colY + 34, altParts.join('\n\n'), {
      fontFamily: FONT_B, fontSize: '11.5px', color: '#F0E4C8', wordWrap: { width: colW - 28 }, lineSpacing: 2,
    }));

    const names = { aral: 'ARAL SEA', health: 'PUBLIC HEALTH', awareness: 'PUBLIC VOICE' };
    const colors = { aral: '#6FB4C4', health: '#7ABF5A', awareness: '#E0B040' };
    const eff = Object.keys(opt.effects);
    eff.forEach((k, idx) => {
      const v = opt.effects[k];
      const x = px + (idx - (eff.length - 1) / 2) * 220;
      c.add(this.add.text(x, py + 124, `${names[k]}  ${v > 0 ? '+' : ''}${v}`, {
        fontFamily: FONT_H, fontSize: '15px', color: v > 0 ? colors[k] : '#8B7355', letterSpacing: 1,
      }).setOrigin(0.5));
    });

    const last = this.state.era >= ERAS.length - 1;
    const btn = this.add.text(px, py + 218, last ? '[ COMPLETE CHRONICLE — SPACE ]' : '[ NEXT ERA — SPACE ]', {
      fontFamily: FONT_H, fontSize: '15px', color: '#FFE8C0', letterSpacing: 2,
      backgroundColor: '#5C3A1E', padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    c.add(btn);
    c.setScrollFactor(0, 0, true);

    const proceed = () => {
      if (this.mode !== 'modal') return;
      this.closeModal();
      this.advanceEra();
    };
    btn.on('pointerdown', proceed);
    this.modalKey = (e) => { if (e.code === 'Space' || e.code === 'Enter') proceed(); };
  }

  advanceEra() {
    const next = this.state.era + 1;
    this.mode = 'transition';
    soundManager.playTimeShift();
    this.cameras.main.fadeOut(900, 0, 0, 0);
    this.time.delayedCall(1000, () => {
      if (next >= ERAS.length) { this.finishCampaign(); return; }
      this.state.era = next;
      this.state.suit = false;
      this.suitHP = 0;
      this.carrying = null;
      this.dose = 0;
      this.saveState();
      const s = ERAS[next].start;
      this.player.setPosition(s.x, s.y);
      this.player.setVelocity(0, 0);
      this.player.setTexture('eco_player');
      this.resetCloud();
      this.redrawWorld();
      this.refreshAll();
      this.cameras.main.fadeIn(900, 0, 0, 0);
      this.showEraIntro(next, false);
    });
  }

  finishCampaign() {
    const payload = { stats: { ...this.state.stats }, choices: [...this.state.choices] };
    try { localStorage.removeItem(ECO_SAVE_KEY); } catch (e) {}
    this.scene.start('EcoFinalScene', payload);
  }
}
