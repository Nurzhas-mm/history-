// Campaign II: "Mending the Past" — Environmental Crisis of Kazakhstan in the XX century.
// Player travels through 4 eras (chronologically) and softens the damage as far as history allows.

export const ECO_SAVE_KEY = 'eco_mending_save';

export const ECO_MAP = {
  width: 3600,
  height: 1600,
  westBorderX: 1250, // Border between Aral region (0..1250) and Central Hub (1250..2350)
  eastBorderX: 2350, // Border between Central Hub (1250..2350) and Semipalatinsk Polygon (2350..3600)
};

// Radiation hotspots inside the Polygon zone (x > 2350)
export const HOTSPOTS = [
  { x: 3220, y: 480, r: 350 },  // Ground Zero crater
  { x: 3020, y: 1080, r: 300 }, // Dolon fallout measurement point
  { x: 2620, y: 540, r: 240 },  // Meteorological tower & bunker sector
];

// Buildings and large structures on the map (with solid physics colliders)
export const ECO_BUILDINGS = [
  // Aral Zone (0..1250)
  { id: 'b_lighthouse', x: 860, y: 290, w: 76, h: 110, type: 'lighthouse', label: 'Old Aralsk Lighthouse', color: 0xD8CFC0 },
  { id: 'b_hydro_post', x: 1080, y: 260, w: 130, h: 90, type: 'brick', label: 'Hydrological Station', color: 0x7A98A6 },
  { id: 'b_cannery', x: 1030, y: 560, w: 165, h: 110, type: 'industrial', label: 'Aralsk Fish Cannery', color: 0x8A6A52 },
  { id: 'b_fisher_house', x: 990, y: 1120, w: 130, h: 92, type: 'house', label: 'Fishing Village (Muinak)', color: 0xB89B74 },

  // Central Hub — Chroniclers HQ & Nevada-Semipalatinsk Square (1250..2350)
  { id: 'b_academy', x: 1800, y: 340, w: 210, h: 120, type: 'academy', label: 'Academy of Sciences Expedition Corps', color: 0xC9B48C },
  { id: 'b_clinic', x: 1470, y: 480, w: 155, h: 102, type: 'clinic', label: 'Field Medical Post & Archive', color: 0xE2E6E8 },
  { id: 'b_telemetry', x: 2130, y: 480, w: 155, h: 102, type: 'brick', label: 'Chronography Pavilion', color: 0x9C8A70 },
  { id: 'b_tribune', x: 1800, y: 1220, w: 220, h: 92, type: 'tribune', label: 'Nevada–Semipalatinsk Movement Tribune', color: 0x8B3A2E },

  // Semipalatinsk Polygon & Dolon Village (2350..3600)
  { id: 'b_bunker', x: 2740, y: 330, w: 165, h: 105, type: 'bunker', label: 'Command Bunker KP-1', color: 0x686A65 },
  { id: 'b_dolon_yurt', x: 2560, y: 1040, w: 116, h: 98, type: 'yurt', label: 'Shepherds\' Aul', color: 0xD4C098 },
  { id: 'b_dolon_house', x: 2800, y: 1220, w: 140, h: 96, type: 'house', label: 'Dolon Village', color: 0xA68B6A },
];

export const ECO_INTRO = [
  { speaker: 'Chronoscope', text: '1991. You are a young ecologist at the Academy of Sciences. The "Chronoscope" device allows you to leave a Memorandum at pivotal turning points of the past.' },
  { speaker: 'Chronoscope', text: 'Rule: you cannot annul state decrees or halt the march of history. However, you can warn people, persuade officials, and mitigate the devastating consequences.' },
  { speaker: 'Chronoscope', text: 'In each era, only the region where the fate of that year is decided is open. Gather 3 pieces of evidence, then file your Memorandum at the Chronicle Table in the Central Hub.' },
];

export const ERAS = [
  {
    id: 'e1',
    year: '1949',
    title: 'THE POLYGON: BEFORE THE FIRST DETONATION',
    sub: 'Semipalatinsk Nuclear Test Site',
    objective: 'Head east past the Polygon checkpoint. Inspect the weather tower, the measurement point near Dolon village, and speak with the shepherd.',
    start: { x: 2260, y: 800 },
    allowedZones: {
      minX: 1270,
      maxX: 3560,
      westBlockedMsg: '⚠ 1949: Passage to the Aral region is closed! Your mission now lies to the east — at the Semipalatinsk Test Site (RDS-1 test). The Aral Sea zone opens in 1960.',
      eastBlockedMsg: '',
    },
    tint: 0xD8B878,
    intro: [
      { speaker: 'Chronoscope', text: 'August 29, 1949. On the steppe near Semipalatinsk, preparations are underway for the first Soviet atomic bomb test (RDS-1). Residents of nearby villages have not been warned.' },
      { speaker: 'Chronoscope', text: 'I am overlaying radiation readings from the future onto this era. Collect evidence at the test site and in Dolon village — it will help persuade the state commission.' },
    ],
    decision: {
      title: 'MEMORANDUM TO THE STATE TESTING COMMISSION',
      question: 'What will you propose to the commission before the first nuclear detonation?',
      options: [
        {
          label: 'Evacuate villages along the wind path, seal wells, and organize medical screenings',
          effects: { health: 40, awareness: 10 },
          outcome: 'The commission does not cancel the test — that order came from the very top. However, several villages are evacuated from the fallout path, wells are covered, and doctors begin monitoring. Thousands of lives are spared.',
          verdict: 'Evacuation & Medical Monitoring',
        },
        {
          label: 'Quietly warn local residents without raising official alarm',
          effects: { health: 18, awareness: 4 },
          outcome: 'Rumors spread across the steppe and some families leave on their own. Without official support, however, many doubt the danger and remain behind.',
          verdict: 'Covert Warning',
        },
        {
          label: 'Only record scientific data for future researchers',
          effects: { health: 0, awareness: 0 },
          outcome: 'The findings are classified as top secret. Local villagers learn nothing, and history unfolds along its tragic course.',
          verdict: 'Passive Observation Only',
        },
      ],
    },
  },
  {
    id: 'e2',
    year: '1960',
    title: 'ARAL: THE RECEDING SEA',
    sub: 'Aral Region, Aralsk, and Muinak',
    objective: 'Head west through the Aral checkpoint. Find the water gauge at the pier, the irrigation engineer by the canal, and the old fisherman.',
    start: { x: 1340, y: 800 },
    allowedZones: {
      minX: 40,
      maxX: 2330,
      westBlockedMsg: '',
      eastBlockedMsg: '⚠ 1960: The Semipalatinsk Polygon is closed to your expedition. Your task lies to the west, on the shores of the Aral Sea!',
    },
    tint: 0xB8D8E0,
    intro: [
      { speaker: 'Chronoscope', text: '1960. The Aral Sea is the fourth-largest lake in the world. Yet the Amu Darya and Syr Darya rivers that feed it are being increasingly diverted to irrigate vast cotton fields.' },
      { speaker: 'Chronoscope', text: 'Instrument projection: by the 1990s, the sea will lose most of its surface area. Head west into the Aral region while there is still time to alter the course.' },
    ],
    decision: {
      title: 'WATER MANAGEMENT PLAN',
      question: 'How will you propose to revise the regional irrigation plan?',
      options: [
        {
          label: 'Line canals with concrete, adopt water-saving irrigation, and guarantee water discharge into the delta',
          effects: { aral: 45, awareness: 15 },
          outcome: 'The state cotton quota is not canceled, but far more water reaches the sea. The Aral still shrinks, yet it avoids rapid and catastrophic desiccation.',
          verdict: 'Concrete-Lined Canals & Guaranteed Delta Flow',
        },
        {
          label: 'Replace part of the cotton quota with less water-intensive crops',
          effects: { aral: 25, awareness: 5 },
          outcome: 'Some water is conserved, but massive seepage losses in unlined earthen canals persist. The sea slows its retreat but does not stop shrinking.',
          verdict: 'Partial Crop Rotation',
        },
        {
          label: 'Fulfill the plan as written: expand earthen canals for cotton',
          effects: { aral: 0, awareness: 0 },
          outcome: 'Cotton harvests grow, while the sea dies. The shoreline retreats rapidly toward the horizon.',
          verdict: 'Unrestricted Canal Expansion',
        },
      ],
    },
  },
  {
    id: 'e3',
    year: '1989',
    title: 'THE NEVADA–SEMIPALATINSK MOVEMENT',
    sub: 'The People\'s Voice Against Nuclear Testing',
    objective: 'Explore the Central Hub and Rally Square. Find the radiologist at the medical post, the petition sheets, and poet Olzhas Suleimenov at the tribune.',
    start: { x: 1800, y: 940 },
    allowedZones: {
      minX: 1270,
      maxX: 2330,
      westBlockedMsg: '⚠ 1989: The fate of the anti-nuclear movement is being decided right now! Remain in the Central Hub and Nevada–Semipalatinsk Rally Square.',
      eastBlockedMsg: '⚠ 1989: The Polygon perimeter is cordoned off by the military. Gather the doctor\'s report, the poet\'s appeal, and petition signatures in the Central Hub!',
    },
    tint: 0xE0E0E0,
    intro: [
      { speaker: 'Chronoscope', text: '1989. The nuclear test site has operated for forty years. After underground tests on 12 and 17 February vent radioactive gases, public patience finally runs out.' },
      { speaker: 'Chronoscope', text: 'On 26 February poet Olzhas Suleimenov uses a televised address to warn the public. On 28 February the "Nevada–Semipalatinsk" movement is founded at the Writers\' Union in Almaty. Help the people\'s voice be heard.' },
    ],
    decision: {
      title: 'PUBLIC APPEAL',
      question: 'How will you organize the anti-nuclear movement?',
      options: [
        {
          label: 'Hold an open public rally, launch a nationwide petition, and invite international press',
          effects: { awareness: 40, health: 10 },
          outcome: 'Thousands gather on the square. Over a million signatures, press coverage, and international solidarity force the cancellation of planned nuclear explosions.',
          verdict: 'Mass Rally & International Glasnost',
        },
        {
          label: 'Send a quiet official petition to Moscow without holding street rallies',
          effects: { awareness: 18, health: 4 },
          outcome: 'The petition reaches ministerial desks, but without public pressure it is easily shelved.',
          verdict: 'Closed-Door Petition',
        },
        {
          label: 'Wait for formal permission from the authorities',
          effects: { awareness: 0, health: 0 },
          outcome: 'Permission never arrives. Public anxiety remains unspoken.',
          verdict: 'Waiting for Official Permission',
        },
      ],
    },
  },
  {
    id: 'e4',
    year: '1991',
    title: 'CLOSING THE POLYGON & RETURN OF THE SEA',
    sub: 'Beginning the Long Recovery (All Zones Open)',
    objective: 'All checkpoints are open! Inspect the Polygon main gates (in the east), the future Kokaral Dam site (in the west), and speak with the chief hydrologist in the Hub.',
    start: { x: 1800, y: 940 },
    allowedZones: {
      minX: 40,
      maxX: 3560,
      westBlockedMsg: '',
      eastBlockedMsg: '',
    },
    tint: 0xFFF0D0,
    intro: [
      { speaker: 'Chronoscope', text: 'August 29, 1991. By Decree No. 409, the Semipalatinsk Nuclear Test Site is officially and permanently closed.' },
      { speaker: 'Chronoscope', text: 'Both borders are now open: the silenced Polygon in the east and the exposed Aral seabed in the west. Gather the final data and launch the national recovery program!' },
    ],
    decision: {
      title: 'NATIONAL RECOVERY PROGRAM',
      question: 'What will you propose to the government of independent Kazakhstan?',
      options: [
        {
          label: 'Seal the Polygon, map radiation hazards, and begin building the Kokaral Dam immediately',
          effects: { health: 25, aral: 35, awareness: 10 },
          outcome: 'The dam — which in real history was completed only in 2005 — is built nearly fifteen years earlier. The North Aral Sea rises, salinity drops, and fisheries return.',
          verdict: 'Polygon Rehabilitation & Early Kokaral Dam',
        },
        {
          label: 'Seal the Polygon and focus on radiation cleanup, postponing the dam project',
          effects: { health: 15, aral: 0, awareness: 5 },
          outcome: 'Contaminated zones are secured and monitored, but the North Aral continues to recede for many more years.',
          verdict: 'Polygon Rehabilitation Only',
        },
        {
          label: 'Wait for international financial aid before acting',
          effects: { health: 0, aral: 0, awareness: 0 },
          outcome: 'International assistance arrives slowly. Precious years of recovery are lost.',
          verdict: 'Delayed Action',
        },
      ],
    },
  },
];

export const ECO_EVIDENCE = [
  { id: 'e1_wind', era: 0, title: 'Wind Rose Chart', text: 'On the morning of the test, the wind carries the radioactive plume directly over the villages of Dolon and Sarzhal. Residents have not been warned.' },
  { id: 'e1_dosi', era: 0, title: 'Dolon Village Dosimetry', text: 'The Chronoscope overlays future measurements: after detonation, radiation at Dolon spikes hundreds of times above background levels. Cattle graze outside and wells remain uncovered.' },
  { id: 'e1_herd', era: 0, title: 'Shepherd\'s Testimony', text: '"They told us it was routine military exercises. Nobody evacuated the children or covered the village wells."' },
  { id: 'e2_stake', era: 1, title: 'Pier Water Gauge', text: 'High-water marks from previous years now stand above dry sand. Massive water diversions from the Syr Darya and Amu Darya for cotton irrigation have broken the sea\'s balance.' },
  { id: 'e2_plan', era: 1, title: 'Irrigation Engineer\'s Report', text: 'Unlined earthen canals lose nearly half of their water into the desert sand, yet cotton production quotas take priority over saving the sea.' },
  { id: 'e2_fish', era: 1, title: 'Fisherman\'s Testimony', text: '"Our fish cannery once fed half the country. Now the water grows saltier, spawning grounds dry up, and fishing boats run aground."' },
  { id: 'e3_doc', era: 2, title: 'Radiologist\'s Medical Report', text: 'A sharp rise in oncology cases and congenital conditions in districts surrounding the Polygon. For decades, doctors were forbidden from recording radiation-related diagnoses.' },
  { id: 'e3_sign', era: 2, title: 'Petition Signature Sheets', text: 'Hundreds of thousands of signatures from across Kazakhstan demanding an immediate halt to nuclear weapons testing.' },
  { id: 'e3_poet', era: 2, title: 'Poet\'s Appeal', text: '"The word is also a weapon. Let us speak the truth aloud to the entire world so the nuclear test site falls silent forever."' },
  { id: 'e4_gate', era: 3, title: 'Polygon Gate Sensor', text: 'Testing has ended, but tunnels and craters still hold plutonium and cesium. Contamination mapping, perimeter security, and land rehabilitation are urgently needed.' },
  { id: 'e4_dam', era: 3, title: 'Kokaral Strait Survey', text: 'The narrow Berg Strait between the North and South Aral can be enclosed with a dam, retaining the Syr Darya\'s flow to refill the Small Aral Sea.' },
  { id: 'e4_hydro', era: 3, title: 'Chief Hydrologist\'s Assessment', text: '"In real history, the Kokaral Dam was completed in 2005 — and the North Aral Sea truly came back to life, lowering salinity and restoring native fish."' },
];

// Map objects. `era: 'all'` means visible in every era.
export const ECO_OBJECTS = [
  // Era 0 — 1949, Semipalatinsk Polygon (East zone: x > 2350)
  { id: 'o_tower', era: 0, x: 2620, y: 540, texture: 'eco_tower', name: 'Polygon Weather Tower', evidenceId: 'e1_wind',
    lines: [
      { speaker: 'Weather Tower', text: 'The barograph traces the wind rose for the morning of August 29, 1949. The wind will carry the radioactive fallout plume straight across inhabited auls and Dolon village.' },
    ] },
  { id: 'o_dosi', era: 0, x: 3020, y: 1080, texture: 'eco_geiger', name: 'Measurement Point (Dolon Village)', evidenceId: 'e1_dosi',
    minigame: 'tuner', bonus: { health: 4 },
    lines: [
      { speaker: 'Chronoscope Dosimeter', text: 'The counter crackles off the scale... The Chronoscope projects the fallout dose that will settle here hours after detonation: over 150 roentgens.' },
    ] },
  { id: 'n_herder', era: 0, x: 2560, y: 1185, texture: 'eco_npc', tint: 0xD8B890, name: 'Shepherd Sarsen', evidenceId: 'e1_herd',
    lines: [
      { speaker: 'Shepherd Sarsen', text: 'Assalaumagaleikum! The soldiers told us these are ordinary artillery exercises. Then why did the officers retreat into concrete bunkers while leaving our families out in the open steppe?' },
      { speaker: 'Shepherd Sarsen', text: 'No one evacuated the children, the wells are uncovered, and our livestock graze right beside the barbed wire. If you can reach the commission — demand an evacuation!' },
    ],
    repeat: 'Please, tell headquarters to move our people out of the wind\'s path!' },

  // Era 1 — 1960, Aral Sea (West zone: x < 1250)
  { id: 'o_stake', era: 1, x: 840, y: 780, texture: 'eco_stake', name: 'Pier Water Gauge', evidenceId: 'e2_stake',
    lines: [
      { speaker: 'Water Gauge', text: 'Water level markings from past years already stand above dry sand. Massive diversions from the Amu Darya and Syr Darya have disrupted the Aral Sea\'s ancient equilibrium.' },
    ] },
  { id: 'n_engineer', era: 1, x: 1070, y: 410, texture: 'eco_npc', tint: 0xB0C8E0, name: 'Irrigation Engineer', evidenceId: 'e2_plan',
    minigame: 'leaks', bonus: { aral: 6 },
    lines: [
      { speaker: 'Irrigation Engineer', text: 'Look at the main irrigation canal: the bed has no concrete lining! Nearly half of the diverted river water seeps uselessly into the desert sand.' },
      { speaker: 'Irrigation Engineer', text: 'If we line the canal beds with concrete and guarantee a minimum ecological flow into the Syr Darya delta, we can save tens of cubic kilometers of water for the sea.' },
    ],
    repeat: 'Record these hydrological calculations in your Memorandum at the Chronicle Table.' },
  { id: 'n_fisher', era: 1, x: 910, y: 1255, texture: 'eco_npc', tint: 0xA0B8A0, name: 'Old Fisherman Khakim', evidenceId: 'e2_fish',
    lines: [
      { speaker: 'Fisherman Khakim', text: 'Our Aralsk cannery used to process tens of thousands of tons of fish a year, feeding communities across the country. Now the water grows salty and delta spawning grounds are drying up.' },
      { speaker: 'Fisherman Khakim', text: 'If the sea retreats, our ships will be left rusting in a desert of salt flats, and toxic salt storms will blow across the steppe.' },
    ],
    repeat: 'While the water still holds, our fishing boats continue to put out to sea.' },

  // Era 2 — 1989, Central Hub & Rally Square (1250..2350)
  { id: 'n_doctor', era: 2, x: 1545, y: 625, texture: 'eco_npc', tint: 0xF0F0F0, name: 'Radiologist', evidenceId: 'e3_doc',
    lines: [
      { speaker: 'Radiologist', text: 'For forty years we were strictly forbidden from diagnosing radiation sickness in the districts around Semipalatinsk. Everything was attributed to ordinary ailments.' },
      { speaker: 'Radiologist', text: 'Here are the clinic\'s true medical records: oncology rates, leukemia, and generational trauma. This truth can no longer be hidden behind state secrecy!' },
    ],
    repeat: 'Deliver this medical report to the rally tribune and include it in your Memorandum.' },
  { id: 'o_sign', era: 2, x: 2050, y: 980, texture: 'eco_papers', name: 'Petition Table', evidenceId: 'e3_sign',
    minigame: 'debate', bonus: { awareness: 6 },
    lines: [
      { speaker: 'Petition Sheets', text: 'Thousands of signature sheets signed by miners, shepherds, physicians, and students across Kazakhstan. The people demand the permanent closure of the nuclear test site.' },
    ] },
  { id: 'n_poet', era: 2, x: 1800, y: 1090, texture: 'eco_npc', tint: 0xC8A8D8, name: 'Poet Olzhas Suleimenov', evidenceId: 'e3_poet',
    lines: [
      { speaker: 'Olzhas Suleimenov', text: 'We have remained silent for too long! When the people speak in full voice together with the world — from Semey to Nevada — the nuclear test sites are forced to fall silent.' },
      { speaker: 'Olzhas Suleimenov', text: 'Support an open rally and full public transparency at the Chronicle Table!' },
    ],
    repeat: 'Go to the Chronicle Table. The voice of the people must ring out openly!' },

  // Era 3 — 1991, All zones open (0..3600)
  { id: 'o_gate', era: 3, x: 3150, y: 760, texture: 'eco_gate', name: 'Polygon Main Gates', evidenceId: 'e4_gate',
    lines: [
      { speaker: 'Polygon Gate Sensor', text: 'Nuclear tests have been halted by the decree of August 29, 1991. Yet the soil and tunnels still hold plutonium and cesium — a national rehabilitation and monitoring program is essential.' },
    ] },
  { id: 'o_dam', era: 3, x: 890, y: 1320, texture: 'eco_dam', name: 'Kokaral Strait (Dam Site)', evidenceId: 'e4_dam',
    minigame: 'dam', bonus: { aral: 6 },
    lines: [
      { speaker: 'Geodetic Survey', text: 'The Berg Strait is narrow here. If we construct the Kokaral Dam with a spillway, the Syr Darya\'s waters will stop draining into the dry southern basin and will refill the North Aral Sea!' },
    ] },
  { id: 'n_hydro', era: 3, x: 1800, y: 500, texture: 'eco_npc', tint: 0xA8D0C8, name: 'Chief Hydrologist', evidenceId: 'e4_hydro',
    lines: [
      { speaker: 'Chief Hydrologist', text: 'In actual history, the permanent Kokaral Dam was completed only in 2005 — and the Small Aral Sea genuinely revived!' },
      { speaker: 'Chief Hydrologist', text: 'If we launch the project in our 1991 national recovery program right now, we can save coastal villages and restore fisheries fourteen years earlier.' },
    ],
    repeat: 'All three pieces of 1991 evidence are ready — make your final decision at the Chronicle Table!' },

  // Always visible in the center of the Hub
  { id: 'o_council', era: 'all', x: 1800, y: 800, texture: 'eco_council', name: 'Chronicle Table', council: true,
    lines: [] },

  // Radiation-safety stations (always available)
  { id: 'o_suit', era: 'all', x: 2130, y: 635, texture: 'eco_crate', name: 'Hazmat Equipment Depot', special: 'suit',
    lines: [] },
  { id: 'o_decon', era: 'all', x: 1355, y: 685, texture: 'eco_decon', name: 'Decontamination Station', special: 'decon',
    lines: [] },
];

// Places where the player can take cover during radioactive fallout waves.
export const SHELTERS = [
  { x: 1520, y: 1040, label: 'Field Tent' },
  { x: 2080, y: 1040, label: 'Field Tent' },
  { x: 1540, y: 700, label: 'Field Tent' },
  { x: 2060, y: 700, label: 'Field Tent' },
  { x: 2460, y: 960, label: 'Field Tent' },
  { x: 2700, y: 960, label: 'Field Tent' },
  { x: 2740, y: 425, label: 'Command Bunker' },
  { x: 1470, y: 575, label: 'Medical Post' },
];

// Eras where a radioactive release (cloud) periodically sweeps across the Polygon.
export const CLOUD_ERAS = {
  0: { label: 'Wind carries the radioactive plume across the steppe', firstDelay: 38, interval: 70 },
  2: { label: 'Radioactive gas venting after an underground nuclear test', firstDelay: 30, interval: 65 },
};

// Debate rounds for the 1989 signature-collecting mini-game.
export const DEBATE_ROUNDS = [
  {
    who: 'Ministry Official',
    claim: '"The tests are completely safe. Radiation never leaves the Polygon perimeter, and local complaints are exaggerations."',
    options: [
      { text: 'Present the radiologist\'s medical report: oncology and leukemia cases in villages around the Polygon', ok: true },
      { text: 'Agree — arguing with central ministries is pointless' },
      { text: 'Promise that villagers will relocate on their own' },
    ],
    explain: 'Documented medical statistics outweigh bureaucratic assurances.',
  },
  {
    who: 'Party Functionary',
    claim: '"Only troublemakers are signing these petitions. Ordinary working people fully support the test site."',
    options: [
      { text: 'Remain silent to avoid trouble' },
      { text: 'Present the petition sheets: hundreds of thousands of signatures from miners, shepherds, doctors, and students', ok: true },
      { text: 'Suggest postponing the issue until the next committee session' },
    ],
    explain: 'Verified signatures from across the republic are undeniable proof of public will.',
  },
  {
    who: 'Central Newspaper Journalist',
    claim: '"Why bring people out onto the square? Write a quiet letter and let officials handle it behind closed doors."',
    options: [
      { text: 'Closed-door letters get buried. The truth must ring out to the whole world, just as the poet urged', ok: true },
      { text: 'All right, we will send a quiet letter and wait' },
      { text: 'Withhold the data so we do not cause public alarm' },
    ],
    explain: 'Public transparency (Glasnost) and open rallies forced the nuclear test site to close.',
  },
];

// Living side missions ("Community Missions"). Types: escort | carry | plant.
export const ECO_MISSIONS = [
  {
    id: 'm_herd', era: 0, type: 'escort',
    title: 'Evacuate the Shepherd\'s Family',
    giver: { x: 3330, y: 1240, name: 'Shepherd Aidar\'s Family', tint: 0xD8B890 },
    goal: { x: 2200, y: 960, name: 'Evacuation Point' },
    reward: { health: 8, awareness: 2 },
    objective: 'Escort Aidar\'s family west to the Evacuation Point in the Hub. Take cover inside shelters during fallout warnings!',
    intro: [
      { speaker: 'Aidar', text: 'Hello! We heard something terrible is about to happen on the steppe today. My wife and daughter cannot make it out alone — the fallout plume is heading straight toward us.' },
      { speaker: 'Aidar', text: 'Please guide us to the Evacuation Point in the west. If a fallout wave approaches, lead us into a tent or bunker!' },
    ],
    waitLine: 'Lead us west to the Evacuation Point! Please, hurry!',
    done: [
      { speaker: 'Aidar', text: 'We made it safely — thank you! Now my daughter won\'t drink from a contaminated well. Your Memorandum will help save many other families too.' },
    ],
    failMsg: 'Aidar\'s family absorbed too much radiation. They retreated to the start — try escorting them again using shelters.',
  },
  {
    id: 'm_water', era: 1, type: 'carry',
    title: 'Fresh Water for the Fishing Village',
    giver: { x: 1145, y: 1230, name: 'Bakhyt, Fisherman\'s Wife', tint: 0xE0B8B0 },
    pickup: { x: 1180, y: 700, name: 'Hydrological Post Cistern', item: 'Fresh Water Barrel' },
    reward: { health: 5, awareness: 3 },
    objective: 'Pick up a barrel of fresh water at the hydrological post cistern and carry it south to the fisherman\'s wife.',
    intro: [
      { speaker: 'Bakhyt', text: 'The wells in our village have turned brackish and salty, and the children are falling ill. The hydrological station to the north has a cistern of fresh water, but it\'s too heavy for me to carry.' },
      { speaker: 'Bakhyt', text: 'Please bring us a barrel! You will walk a bit slower while carrying the heavy barrel.' },
    ],
    waitLine: 'The water cistern is at the hydrological post to the north. Please bring a barrel to us!',
    pickupLines: [
      { speaker: 'Hydrological Post', text: 'You hoist the heavy barrel of fresh water onto your shoulder. Carry it south to Bakhyt in the fishing village.' },
    ],
    done: [
      { speaker: 'Bakhyt', text: 'Clean, fresh water! Now the children can drink safely. Tell them at Headquarters: if the sea disappears, only salt and dust will remain for us.' },
    ],
  },
  {
    id: 'm_children', era: 2, type: 'escort',
    title: 'Children from the Fallout Zone',
    giver: { x: 2200, y: 1150, name: 'Nurse Gulnaz with Children', tint: 0xF0D8E8 },
    goal: { x: 1450, y: 585, name: 'Field Medical Post' },
    reward: { health: 6, awareness: 4 },
    objective: 'Escort Nurse Gulnaz and the children northwest to the Field Medical Post. Take shelter in tents during gas releases.',
    intro: [
      { speaker: 'Gulnaz', text: 'After the underground nuclear test, radioactive gases are drifting over nearby villages. These children showing radiation symptoms must reach the Field Medical Post immediately.' },
      { speaker: 'Gulnaz', text: 'If another gas wave hits, we must take cover inside a tent. Please lead the way — we will follow right behind you.' },
    ],
    waitLine: 'Let\'s head to the Field Medical Post in the northwest. Don\'t leave us out under the gas cloud!',
    done: [
      { speaker: 'Gulnaz', text: 'Thank you! Here we have air filters and physicians. Tell everyone at the rally what you witnessed — we cannot stay silent any longer.' },
    ],
    failMsg: 'The children absorbed too much radiation. Return to the start of the mission and use shelters along the route.',
  },
  {
    id: 'm_saxaul', era: 3, type: 'plant',
    title: 'Saxaul Trees on the Dry Seabed',
    giver: { x: 1620, y: 1180, name: 'Forester Mira', tint: 0xB8E0B0 },
    sites: [{ x: 750, y: 520 }, { x: 770, y: 1040 }, { x: 740, y: 1300 }],
    reward: { aral: 8, health: 2 },
    objective: 'Plant 3 saxaul saplings on the exposed Aral seabed (in the west). Planting spots are marked on your radar.',
    intro: [
      { speaker: 'Mira', text: 'Toxic salt storms from the exposed seabed carry dust hundreds of kilometers across the steppe. Saxaul roots bind the shifting sand — they are nature\'s best shield.' },
      { speaker: 'Mira', text: 'Here are three saxaul saplings. Plant them at the marked spots on the western seabed so the land can begin healing right now.' },
    ],
    waitLine: 'The three planting spots are on the dry seabed to the west. Follow the cyan markers on your radar!',
    done: [
      { speaker: 'Mira', text: 'Their roots are already holding the sand in place. In a few years, a green shelterbelt will stand here. Thank you, chronicler!' },
    ],
  },
];

export const RANKS = [
  { min: 65, title: 'GUARDIAN OF THE STEPPE', color: '#FFD700' },
  { min: 40, title: 'WITNESS OF HISTORY', color: '#C4A46C' },
  { min: 0, title: 'LATE OBSERVER', color: '#A0896C' },
];

export const ECO_FACTS = [
  '456 nuclear tests were conducted at the Semipalatinsk Test Site (1949–1989), across an area of ~18,500 km².',
  'The Aral Sea lost roughly 90% of its water volume and split into the North (Small) and South Aral Seas.',
  'The Semipalatinsk Test Site was closed on August 29, 1991; the Kokaral Dam saved the North Aral Sea in 2005.',
];

// ==========================================================================
// HISTORICAL DEPTH LAYER
// ERA_INSIGHTS[i] belongs to ERAS[i]:
//   epigraph   — primary-source line shown on the era title card
//   context    — "Historical Constraints": what a scientist could realistically change in that year
//   realHistory— what actually happened (shown next to the player's altered timeline)
//   options[j] — { moscow, steppe, legacy } for decision option j:
//                moscow = how the central Soviet state reacts,
//                steppe = what the local people pay / gain,
//                legacy = how the world visibly changes later ("Memory of the Land")
// ==========================================================================
export const ERA_INSIGHTS = [
  {
    epigraph: {
      kind: 'ARCHIVAL RECORD',
      text: 'Test code-named "First Lightning" (RDS-1). Semipalatinsk Test Site, 29 August 1949, 07:00 local time.',
      source: 'Soviet nuclear programme test record',
    },
    context: 'In 1949 the decision to test RDS-1 was taken at the very top of the Soviet state, and the Polygon itself was a state secret. Kazakh SSR authorities had no say, and the security services treated "panic" as a crime. A realistic Memorandum can persuade the commission to protect people — it cannot cancel the test.',
    realHistory: 'On 29 August 1949 the USSR detonated RDS-1 at Semipalatinsk. Nearby villagers were largely not warned or evacuated. Between 1949 and 1989, 456 tests were held there and roughly 1.5 million people were exposed to fallout. In 1957 the secret "Anti-Brucellosis Dispensary" No. 4 opened to monitor victims without telling them the truth.',
    options: [
      {
        moscow: 'The commission cannot cancel the test, but a limited evacuation can be justified as "safety preparations" without revealing the weapon.',
        steppe: 'Families leave homes and pastures before the fallout; herds and wells are abandoned, and the Chronoscope\'s data must be hidden from security officers.',
        legacy: 'Because families were moved out of the fallout path in 1949, more villagers survive — a memorial to the downwinders now stands in the Hub.',
      },
      {
        moscow: 'Nobody in Moscow learns of the leak, but security officers treat any "panic-mongering" as a crime.',
        steppe: 'Trust spreads by word of mouth: some families leave, but many stay because no official ordered them to go.',
        legacy: 'Some families left Dolon in 1949, but many stayed. No memorial was raised — the silence shaped how the tragedy is remembered.',
      },
      {
        moscow: 'The data disappears into a classified archive and the secrecy regime stays intact.',
        steppe: 'The steppe pays in full: no warning, no evacuation, and no recorded names.',
        legacy: 'Nothing visibly changed in 1949. The fallout map stayed secret, and its victims appear only in the clinics of later decades.',
      },
    ],
  },
  {
    epigraph: {
      kind: 'HISTORICAL RECORD',
      text: 'In 1960 the Aral Sea covered about 68,000 km² — the fourth-largest lake in the world.',
      source: 'Aral Sea survey data, c. 1960',
    },
    context: 'In 1960 cotton targets came from five-year plans drawn up in Moscow, and the decline of the Aral Sea was treated as an acceptable price for "white gold". A scientist could argue for lined canals and water-saving irrigation — but could not abolish the cotton quota.',
    realHistory: 'In 1960 the Aral Sea covered about 68,000 km². Soviet planners diverted the Amu Darya and Syr Darya to irrigate cotton through largely unlined canals. By the late 1980s the sea had split into the North and South Aral, and the exposed seabed became the Aralkum desert.',
    options: [
      {
        moscow: 'Planners keep the cotton quotas but accept the extra cost of concrete lining and water-saving irrigation.',
        steppe: 'Fishing towns such as Aralsk and Muinak keep a stronger river inflow and more time to adapt.',
        legacy: 'Your 1960 plan saved water: a concrete-lined canal and green shelterbelts now stand on the Aral shore.',
      },
      {
        moscow: 'Quota revisions need long negotiations with central ministries, so only part of the plan is changed.',
        steppe: 'Some water is saved, but leaky earthen canals still waste huge volumes.',
        legacy: 'Part of the cotton was replaced, but the canal stayed half-lined — the sea shrank more slowly, not less surely.',
      },
      {
        moscow: 'The plan is fulfilled on paper; rising cotton output is celebrated as success.',
        steppe: 'The delta dries, fish catches collapse, and salt storms begin to blow from the exposed seabed.',
        legacy: 'Unlined canals and thick salt crust mark the dried seabed — the cost of choosing cotton over the sea.',
      },
    ],
  },
  {
    epigraph: {
      kind: 'OLZHAS SULEIMENOV, 1989',
      text: '"We called this movement \'Nevada,\' in the hope that our like-minded counterparts in the American state of Nevada who are blockading the atomic test site there will find us their brothers."',
      source: 'On naming the Nevada–Semipalatinsk movement (quoted in M. Evangelista, Unarmed Forces)',
    },
    context: 'By 1989 glasnost had made open public debate possible for the first time. Still, the army and the nuclear ministries controlled the Polygon. Success depended on mass public pressure — not on persuading a single official behind closed doors.',
    realHistory: 'After underground tests on 12 and 17 February vented radioactive gas, Olzhas Suleimenov warned the public on television on 26 February. On 28 February 1989 the Nevada–Semipalatinsk movement was founded at the Writers\' Union in Almaty. Hundreds of thousands signed petitions, tests were sharply reduced, and the last tests took place in late 1989.',
    options: [
      {
        moscow: 'Glasnost makes protest possible, and the Kremlin can no longer ignore a movement backed by hundreds of thousands of signatures.',
        steppe: 'Workers, shepherds, doctors and students unite — Kazakh society finds a collective voice for the first time.',
        legacy: 'Your 1989 rally filled the square: crowds now gather at the Nevada–Semey tribune as a living memorial.',
      },
      {
        moscow: 'A written petition reaches ministry desks, where it can be postponed or quietly filed away.',
        steppe: 'Without public pressure, tests continue and the movement stays small.',
        legacy: 'A petition was sent, but the square never filled — only a few supporters remain at the tribune.',
      },
      {
        moscow: 'Official permission never comes; silence suits the ministries.',
        steppe: 'Fear and secrecy continue, and no one speaks aloud.',
        legacy: 'The square stayed empty — no movement, no crowd, no collective memory of a protest.',
      },
    ],
  },
  {
    epigraph: {
      kind: 'PRIMARY SOURCE',
      text: 'Decree No. 409 of the President of the Kazakh SSR, "On the closure of the Semipalatinsk nuclear test site", 29 August 1991.',
      source: 'Official decree, Republic of Kazakhstan',
    },
    context: 'In late 1991 the USSR was collapsing and Kazakhstan was only days away from becoming a fully independent state (16 December 1991). Its young government had little money, so cleaning up the Polygon had to be weighed against costly water projects.',
    realHistory: 'On 29 August 1991 Decree No. 409 closed the Semipalatinsk Test Site. Kazakhstan then gave up the nuclear arsenal it inherited — then the world\'s fourth largest — and became nuclear-weapon-free in 1995. An early earthen dike at the Kokaral strait (1992) failed in 1999; the concrete Kokaral Dam was completed in 2005, reviving the North Aral Sea.',
    options: [
      {
        moscow: 'The USSR is collapsing: for the first time, Kazakhstan can decide on its own authority.',
        steppe: 'The cost falls on a young state in economic crisis, yet the North Aral begins to recover years earlier.',
        legacy: 'Polygon rehabilitation and an early dam changed the 21st century.',
      },
      {
        moscow: 'Moscow no longer decides, but the money simply is not there.',
        steppe: 'Contaminated land is mapped and fenced, while the North Aral keeps shrinking.',
        legacy: 'The Polygon was secured, but the North Aral waited many more years.',
      },
      {
        moscow: 'Central institutions fade away and no one takes over their responsibilities.',
        steppe: 'Waiting for foreign aid costs years in which people and the sea suffer.',
        legacy: 'Valuable years were lost while the region waited.',
      },
    ],
  },
];

// Pages of the "Historical Chronicles" encyclopedia opened on the final screen.
export const ECO_CHRONICLES = [
  {
    title: 'I. THE POLYGON  (1949–1989)',
    body: 'The Semipalatinsk Test Site was selected in 1947 and began operating on 29 August 1949 with the explosion of RDS-1, the first Soviet atomic bomb. Over forty years it hosted 456 nuclear tests — atmospheric until 1962, then underground. Roughly 1.5 million people in the surrounding districts were exposed to radioactive fallout, including the villages of Dolon and Sarzhal. The state classified everything: doctors could not record radiation-related diagnoses, and in 1957 the secret "Anti-Brucellosis Dispensary" No. 4 was opened to observe the exposed population without informing them of the real cause.',
    terms: [
      'RDS-1 ("First Lightning") — the first Soviet atomic bomb, 1949',
      'Dispensary No. 4 — secret medical monitoring institution, opened 1957',
      'Downwinders — people living in the path of radioactive fallout',
    ],
  },
  {
    title: 'II. THE ARAL SEA  (1960–2005)',
    body: 'Until the 1960s the Aral Sea (c. 68,000 km²) was the fourth-largest lake on Earth, fed by the Amu Darya and Syr Darya. The Soviet plan to turn Central Asia into a cotton base — "white gold" — diverted these rivers into vast, mostly unlined canal networks. The sea dried up: by the late 1980s it split into a North (Kazakh) and a South Aral, fishing ports such as Aralsk and Muinak ended up kilometres from the shore, and salt-laden dust from the Aralkum desert spread across the region. Vozrozhdeniya Island, once the site of a secret Soviet biological-weapons testing ground, became a peninsula. Kazakhstan\'s Kokaral Dam (2005) revived the North Aral.',
    terms: [
      'Aralkum — the new desert created on the exposed seabed',
      'Monoculture — dependence on a single crop, here cotton',
      'Kokaral Dam (2005) — dam separating the North Aral from the South',
    ],
  },
  {
    title: 'III. THE VOICE OF THE PEOPLE  (1989–1991)',
    body: 'After underground tests on 12 and 17 February 1989 vented radioactive gas, poet Olzhas Suleimenov used a televised address on 26 February to warn the public. On 28 February 1989 thousands gathered at the Writers\' Union in Almaty, and the Nevada–Semipalatinsk anti-nuclear movement was born — named in solidarity with American activists at the Nevada Test Site. Hundreds of thousands signed petitions. Under this pressure the number of tests was sharply reduced, and on 29 August 1991 Decree No. 409 closed the Polygon for good. The United Nations later declared 29 August the International Day against Nuclear Tests.',
    terms: [
      'Glasnost — the Soviet policy of openness that made public protest possible',
      'Nevada–Semipalatinsk — the first mass anti-nuclear movement in the USSR',
      'Decree No. 409 — closure of the test site, 29 August 1991',
    ],
  },
  {
    title: 'IV. ECHOES OF ALASH  (1917–1991)',
    body: 'The steppe turned into a test site was also the cradle of Kazakh modern thought: the homeland of the poet and philosopher Abai Kunanbayuly and of Shakarim, and between 1917 and 1920 Semipalatinsk was a centre of the Alash autonomy led by Alikhan Bokeikhanov, Akhmet Baitursynov and Mirzhakyp Dulatov. These leaders were repressed in the 1930s; barely a decade later the same region was selected as the Soviet nuclear test site. When Kazakhstan renounced its own nuclear arsenal in the 1990s, it chose to protect the very heritage that the Alash intelligentsia had once fought to preserve: the people, their language and their land.',
    terms: [
      'Alash Orda — Kazakh autonomous government, 1917–1920',
      'Abai & Shakarim — poets and thinkers of the Semey region',
      'Nuclear renunciation — Kazakhstan was nuclear-weapon-free by 1995',
    ],
  },
  {
    title: 'V. SOURCES FOR FURTHER STUDY',
    body: 'This campaign is an educational simulation: you may soften the damage in the game, but real history allowed no such undo. To research the events further, consult:\n\n• Nuclear Threat Initiative (NTI) — Semipalatinsk Test Site profile\n• Government of Kazakhstan (gov.kz) — materials on the Semipalatinsk Test Site and the International Day against Nuclear Tests\n• e-history.kz — Nevada–Semipalatinsk movement and the history of the Polygon\n• Encyclopaedia Britannica — "Aral Sea" and the Kokaral Dam\n• Matthew Evangelista, Unarmed Forces: The Transnational Movement to End the Cold War (Cornell University Press, 1999)\n\nAlways cross-check dates and figures against several sources before citing them in coursework.',
    terms: [],
  },
];
