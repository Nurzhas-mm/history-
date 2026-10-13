export const MAP_WIDTH = 2650;
export const MAP_HEIGHT = 1200;

export const PLAYER_START = { x: 800, y: 600 };

export const BUILDINGS = [
  // Village Core
  {
    id: 'elder_house',
    x: 200,
    y: 150,
    w: 130,
    h: 110,
    type: 'yurt',
    label: "Elder's House",
    color: 0xC4A46C
  },
  {
    id: 'archive',
    x: 1280,
    y: 130,
    w: 150,
    h: 130,
    type: 'brick',
    label: 'Archive',
    color: 0xA0896C
  },
  {
    id: 'teacher_house',
    x: 180,
    y: 880,
    w: 130,
    h: 110,
    type: 'wooden',
    label: "Teacher's House",
    color: 0x9B8B75
  },
  {
    id: 'house_1',
    x: 700,
    y: 100,
    w: 100,
    h: 85,
    type: 'wooden',
    color: 0xA09080
  },
  {
    id: 'house_2',
    x: 1100,
    y: 850,
    w: 100,
    h: 85,
    type: 'wooden',
    color: 0xA09080
  },
  {
    id: 'house_3',
    x: 380,
    y: 720,
    w: 90,
    h: 75,
    type: 'yurt',
    color: 0xB89870
  },
  {
    id: 'house_4',
    x: 900,
    y: 930,
    w: 100,
    h: 85,
    type: 'wooden',
    color: 0xA09080
  },
  {
    id: 'house_5',
    x: 1380,
    y: 500,
    w: 90,
    h: 75,
    type: 'yurt',
    color: 0xB89870
  },
  {
    id: 'house_6',
    x: 600,
    y: 550,
    w: 95,
    h: 80,
    type: 'wooden',
    color: 0xA09080
  },

  // 4 Companion Candidate Houses in the Village
  {
    id: 'sadyk_yurt',
    x: 490,
    y: 780,
    w: 95,
    h: 80,
    type: 'yurt',
    label: "Sadyk's Yurt",
    color: 0x8A7A65
  },
  {
    id: 'mukhamet_house',
    x: 920,
    y: 875,
    w: 105,
    h: 90,
    type: 'wooden',
    label: "Mukhamet's Office",
    color: 0x7A6A55
  },
  {
    id: 'blacksmith',
    x: 1200,
    y: 750,
    w: 120,
    h: 95,
    type: 'brick',
    label: "Raiymbek's Forge",
    color: 0x6E4A35
  },
  {
    id: 'merchant_manor',
    x: 1420,
    y: 450,
    w: 135,
    h: 105,
    type: 'brick',
    label: "Daulet-bai's Manor",
    color: 0xB89870
  },

  // Frontier Post & Watchtower (Border between village and city)
  {
    id: 'checkpoint_tower',
    x: 2000,
    y: 380,
    w: 80,
    h: 90,
    type: 'wooden',
    label: "Frontier Post",
    color: 0x5C3A1E
  },

  // City of Semey & Alash Headquarters
  {
    id: 'city_house_1',
    x: 2190,
    y: 220,
    w: 115,
    h: 100,
    type: 'brick',
    label: "Semey Guild House",
    color: 0x8A6E55
  },
  {
    id: 'city_house_2',
    x: 2190,
    y: 690,
    w: 115,
    h: 105,
    type: 'brick',
    label: "Semey Printing House",
    color: 0x7A5E45
  },
  {
    id: 'alash_headquarters',
    x: 2420,
    y: 350,
    w: 180,
    h: 150,
    type: 'brick',
    label: "Alash Party Headquarters",
    color: 0x8B3A3A
  }
];

export const TREES = [
  // Village trees
  { x: 50, y: 50 },
  { x: 120, y: 45 },
  { x: 420, y: 55 },
  { x: 560, y: 40 },
  { x: 640, y: 380 },
  { x: 540, y: 400 },
  { x: 100, y: 480 },
  { x: 80, y: 540 },
  { x: 1400, y: 680 },
  { x: 1460, y: 720 },
  { x: 750, y: 600 },
  { x: 1550, y: 60 },
  { x: 1520, y: 120 },
  { x: 1100, y: 380 },
  { x: 1140, y: 400 },
  { x: 50, y: 1000 },
  { x: 100, y: 1050 },
  { x: 800, y: 820 },
  { x: 840, y: 800 },
  { x: 1450, y: 300 },
  { x: 1480, y: 340 },
  { x: 60, y: 300 },
  { x: 400, y: 200 },

  // Steppe road trees & canyon rocks
  { x: 1680, y: 320 },
  { x: 1720, y: 750 },
  { x: 1850, y: 290 },
  { x: 1900, y: 800 },
  { x: 1950, y: 320 },
  { x: 2120, y: 250 },
  { x: 2130, y: 820 },
  { x: 2320, y: 180 },
  { x: 2340, y: 840 },
  { x: 2610, y: 200 },
  { x: 2620, y: 780 }
];

export const NPCS = [
  // Village elders & scholars
  {
    id: 'elder',
    x: 340,
    y: 280,
    texture: 'npc_elder',
    name: 'Village Elder',
    dialogKey: 'elder'
  },
  {
    id: 'teacher',
    x: 340,
    y: 1000,
    texture: 'npc_teacher',
    name: 'Teacher',
    dialogKey: 'teacher'
  },
  {
    id: 'archivist',
    x: 1400,
    y: 280,
    texture: 'npc_archivist',
    name: 'Archivist',
    dialogKey: 'archivist'
  },

  // 4 Companion Candidates in the village
  {
    id: 'sadyk',
    x: 535,
    y: 875,
    texture: 'npc_sadyk',
    name: 'Sadyk the Guide',
    dialogKey: 'sadyk'
  },
  {
    id: 'mukhamet',
    x: 970,
    y: 980,
    texture: 'npc_mukhamet',
    name: 'Mukhamet the Clerk',
    dialogKey: 'mukhamet'
  },
  {
    id: 'raiymbek',
    x: 1260,
    y: 865,
    texture: 'npc_raiymbek',
    name: 'Raiymbek the Blacksmith',
    dialogKey: 'raiymbek'
  },
  {
    id: 'dauletbai',
    x: 1485,
    y: 575,
    texture: 'npc_dauletbai',
    name: 'Daulet-bai the Merchant',
    dialogKey: 'dauletbai'
  },

  // Road Antagonist & Sentry (visible during road journey / Chapter 6)
  {
    id: 'antagonist_leader',
    x: 1820,
    y: 560,
    texture: 'npc_antagonist',
    name: 'Road Ambushers',
    dialogKey: 'antagonist_road'
  },
  {
    id: 'post_sentry',
    x: 2040,
    y: 540,
    texture: 'npc_antagonist',
    name: 'Post Officer',
    dialogKey: 'post_sentry'
  },

  // City: Alash Leader
  {
    id: 'alash_leader',
    x: 2510,
    y: 515,
    texture: 'npc_alash_leader',
    name: 'Alikhan Bokeikhanov',
    dialogKey: 'alash_leader'
  }
];

export const FRAGMENTS = [
  { id: 'fragment_1', x: 580, y: 430 },
  { id: 'fragment_2', x: 1050, y: 650 },
  { id: 'fragment_3', x: 700, y: 220 }
];

export const DECORATIONS = [
  { type: 'fence_h', x: 260, y: 420, w: 200 },
  { type: 'fence_h', x: 900, y: 500, w: 150 },
  { type: 'fence_v', x: 480, y: 600, h: 120 },
  { type: 'well', x: 750, y: 680 },
  { type: 'cart', x: 1100, y: 550 },
  { type: 'stones', x: 500, y: 350 },

  // Village candidate props
  { type: 'horse_hitch', x: 580, y: 860 },
  { type: 'anvil', x: 1220, y: 860 },
  { type: 'trade_carriage', x: 1430, y: 580 },

  // Steppe road checkpoint gate
  { type: 'checkpoint_gate', x: 2040, y: 500 },

  // Semey city props
  { type: 'street_lantern', x: 2180, y: 460 },
  { type: 'street_lantern', x: 2360, y: 460 },
  { type: 'street_lantern', x: 2540, y: 460 },
  { type: 'alash_banner', x: 2510, y: 345 }
];