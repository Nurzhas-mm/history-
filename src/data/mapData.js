export const MAP_WIDTH = 4200;
export const MAP_HEIGHT = 1800;

export const PLAYER_START = { x: 1150, y: 860 };

export const BUILDINGS = [
  // ==================== VILLAGE (AUL) — Spacious Layout (x: 240..2180, y: 180..1540) ====================
  // North-West: Elder's Yurt
  {
    id: 'elder_house',
    x: 280,
    y: 220,
    w: 140,
    h: 120,
    type: 'yurt',
    label: "Elder's House",
    color: 0xC4A46C
  },
  // North-Central-West: Residential House 1
  {
    id: 'house_1',
    x: 860,
    y: 180,
    w: 110,
    h: 95,
    type: 'wooden',
    color: 0xA09080
  },
  // North-Central: Daulet-bai's Manor (Placed well inside the village, far from the eastern border!)
  {
    id: 'merchant_manor',
    x: 1420,
    y: 220,
    w: 150,
    h: 115,
    type: 'brick',
    label: "Daulet-bai's Manor",
    color: 0xB89870
  },
  // North-East: Village Archive
  {
    id: 'archive',
    x: 2020,
    y: 240,
    w: 160,
    h: 135,
    type: 'brick',
    label: 'Archive',
    color: 0xA0896C
  },

  // Mid-West: Residential Yurt 3
  {
    id: 'house_3',
    x: 260,
    y: 680,
    w: 105,
    h: 90,
    type: 'yurt',
    color: 0xB89870
  },
  // Mid-Central-West: Residential House 6
  {
    id: 'house_6',
    x: 720,
    y: 620,
    w: 105,
    h: 90,
    type: 'wooden',
    color: 0xA09080
  },
  // Mid-East: Residential Yurt 5
  {
    id: 'house_5',
    x: 1950,
    y: 720,
    w: 105,
    h: 90,
    type: 'yurt',
    color: 0xB89870
  },

  // South-West: Teacher's House
  {
    id: 'teacher_house',
    x: 280,
    y: 1240,
    w: 140,
    h: 115,
    type: 'wooden',
    label: "Teacher's House",
    color: 0x9B8B75
  },
  // South-Central-West: Sadyk's Yurt
  {
    id: 'sadyk_yurt',
    x: 740,
    y: 1180,
    w: 110,
    h: 95,
    type: 'yurt',
    label: "Sadyk's Yurt",
    color: 0x8A7A65
  },
  // South-Central-East: Mukhamet's Office
  {
    id: 'mukhamet_house',
    x: 1420,
    y: 1180,
    w: 120,
    h: 100,
    type: 'wooden',
    label: "Mukhamet's Office",
    color: 0x7A6A55
  },
  // South-East: Raiymbek's Forge
  {
    id: 'blacksmith',
    x: 1980,
    y: 1140,
    w: 135,
    h: 105,
    type: 'brick',
    label: "Raiymbek's Forge",
    color: 0x6E4A35
  },

  // Far South Row: Residential Houses 4 & 2
  {
    id: 'house_4',
    x: 1120,
    y: 1440,
    w: 110,
    h: 95,
    type: 'wooden',
    color: 0xA09080
  },
  {
    id: 'house_2',
    x: 1760,
    y: 1420,
    w: 110,
    h: 95,
    type: 'wooden',
    color: 0xA09080
  },

  // ==================== FRONTIER POST & WATCHTOWER (Border between Steppe Road and Semey) ====================
  {
    id: 'checkpoint_tower',
    x: 3140,
    y: 660,
    w: 85,
    h: 95,
    type: 'wooden',
    label: "Frontier Post",
    color: 0x5C3A1E
  },

  // ==================== CITY OF SEMEY & ALASH HEADQUARTERS ====================
  {
    id: 'city_house_1',
    x: 3420,
    y: 460,
    w: 125,
    h: 105,
    type: 'brick',
    label: "Semey Guild House",
    color: 0x8A6E55
  },
  {
    id: 'city_house_2',
    x: 3420,
    y: 1060,
    w: 125,
    h: 110,
    type: 'brick',
    label: "Semey Printing House",
    color: 0x7A5E45
  },
  {
    id: 'alash_headquarters',
    x: 3780,
    y: 630,
    w: 190,
    h: 155,
    type: 'brick',
    label: "Alash Party Headquarters",
    color: 0x8B3A3A
  }
];

export const TREES = [
  // North & West Village Perimeter
  { x: 90, y: 90 },
  { x: 180, y: 80 },
  { x: 560, y: 110 },
  { x: 640, y: 90 },
  { x: 1160, y: 100 },
  { x: 1240, y: 130 },
  { x: 1750, y: 110 },
  { x: 1830, y: 95 },
  { x: 2320, y: 140 },
  { x: 2380, y: 210 },

  // Village Interior Groves (Spaced between houses)
  { x: 120, y: 480 },
  { x: 160, y: 550 },
  { x: 540, y: 450 },
  { x: 610, y: 420 },
  { x: 1180, y: 420 },
  { x: 1250, y: 450 },
  { x: 1740, y: 480 },
  { x: 1810, y: 520 },
  { x: 2290, y: 540 },
  { x: 2350, y: 610 },

  // South & Central Village Groves
  { x: 110, y: 980 },
  { x: 160, y: 1060 },
  { x: 530, y: 960 },
  { x: 590, y: 1020 },
  { x: 1050, y: 1220 },
  { x: 1120, y: 1260 },
  { x: 1720, y: 1040 },
  { x: 1790, y: 1090 },
  { x: 2280, y: 1060 },
  { x: 2340, y: 1140 },

  // Far South Village Edge
  { x: 140, y: 1560 },
  { x: 220, y: 1620 },
  { x: 620, y: 1580 },
  { x: 920, y: 1640 },
  { x: 1480, y: 1620 },
  { x: 2120, y: 1580 },
  { x: 2240, y: 1520 },

  // Steppe Road & Canyon Edges
  { x: 2580, y: 580 },
  { x: 2660, y: 1120 },
  { x: 2840, y: 560 },
  { x: 2920, y: 1140 },
  { x: 3060, y: 590 },

  // Semey City Outskirts & Parkland
  { x: 3320, y: 280 },
  { x: 3340, y: 1380 },
  { x: 3680, y: 320 },
  { x: 3700, y: 1360 },
  { x: 4080, y: 360 },
  { x: 4090, y: 1320 }
];

export const NPCS = [
  // Village elders & scholars
  {
    id: 'elder',
    x: 350,
    y: 375,
    texture: 'npc_elder',
    name: 'Village Elder',
    dialogKey: 'elder'
  },
  {
    id: 'teacher',
    x: 350,
    y: 1385,
    texture: 'npc_teacher',
    name: 'Teacher',
    dialogKey: 'teacher'
  },
  {
    id: 'archivist',
    x: 2100,
    y: 405,
    texture: 'npc_archivist',
    name: 'Archivist',
    dialogKey: 'archivist'
  },

  // 4 Companion Candidates in the village
  {
    id: 'sadyk',
    x: 795,
    y: 1305,
    texture: 'npc_sadyk',
    name: 'Sadyk the Guide',
    dialogKey: 'sadyk'
  },
  {
    id: 'mukhamet',
    x: 1480,
    y: 1310,
    texture: 'npc_mukhamet',
    name: 'Mukhamet the Clerk',
    dialogKey: 'mukhamet'
  },
  {
    id: 'raiymbek',
    x: 2045,
    y: 1275,
    texture: 'npc_raiymbek',
    name: 'Raiymbek the Blacksmith',
    dialogKey: 'raiymbek'
  },
  {
    id: 'dauletbai',
    x: 1495,
    y: 365,
    texture: 'npc_dauletbai',
    name: 'Daulet-bai the Merchant',
    dialogKey: 'dauletbai'
  },

  // Road Antagonist & Sentry (visible during road journey / Chapter 6)
  {
    id: 'antagonist_leader',
    x: 2820,
    y: 860,
    texture: 'npc_antagonist',
    name: 'Road Ambushers',
    dialogKey: 'antagonist_road'
  },
  {
    id: 'post_sentry',
    x: 3180,
    y: 845,
    texture: 'npc_antagonist',
    name: 'Post Officer',
    dialogKey: 'post_sentry'
  },

  // City: Alash Leader
  {
    id: 'alash_leader',
    x: 3875,
    y: 815,
    texture: 'npc_alash_leader',
    name: 'Alikhan Bokeikhanov',
    dialogKey: 'alash_leader'
  }
];

export const FRAGMENTS = [
  { id: 'fragment_1', x: 760, y: 520 },
  { id: 'fragment_2', x: 1580, y: 920 },
  { id: 'fragment_3', x: 1080, y: 340 }
];

export const DECORATIONS = [
  { type: 'fence_h', x: 460, y: 340, w: 240 },
  { type: 'fence_h', x: 1360, y: 720, w: 200 },
  { type: 'fence_v', x: 640, y: 780, h: 160 },
  { type: 'well', x: 1150, y: 920 },
  { type: 'cart', x: 1520, y: 780 },
  { type: 'stones', x: 780, y: 480 },

  // Village candidate props
  { type: 'horse_hitch', x: 865, y: 1285 },
  { type: 'anvil', x: 1995, y: 1270 },
  { type: 'trade_carriage', x: 1370, y: 355 },

  // Steppe road checkpoint gate
  { type: 'checkpoint_gate', x: 3180, y: 800 },

  // Semey city props
  { type: 'street_lantern', x: 3350, y: 775 },
  { type: 'street_lantern', x: 3560, y: 775 },
  { type: 'street_lantern', x: 3760, y: 775 },
  { type: 'street_lantern', x: 3350, y: 945 },
  { type: 'street_lantern', x: 3560, y: 945 },
  { type: 'alash_banner', x: 3875, y: 625 }
];