export const CHAPTERS = {
  ch1: {
    id: 'ch1',
    title: 'The Missing Page',
    number: 1,
    objective: 'Search the village for the manuscript pages, then return to the Archivist.',
    reward: 10,
  },
  ch2: {
    id: 'ch2',
    title: 'Voices of the Village',
    number: 2,
    objective: 'Question the Elder, the Teacher and the Archivist. Trust opens doors.',
    targetsToInterview: ['elder', 'teacher', 'archivist'],
    reward: 10,
  },
  ch3: {
    id: 'ch3',
    title: 'The Evidence',
    number: 3,
    objective: 'Find evidence and connect clues (TAB). Learn what was on the missing page.',
    evidenceToFind: 5,
    deductionsNeeded: 3,
    keyDeduction: 'names_list',
    reward: 15,
  },
  ch4: {
    id: 'ch4',
    title: 'After Dark',
    number: 4,
    objective: 'Ask the Elder what to do next.',
    reward: 15,
  },
  ch5: {
    id: 'ch5',
    title: 'The Empty Cache',
    number: 5,
    objective: 'Check the hiding place under the stone by the old well.',
    reward: 15,
  },
  ch6: {
    id: 'ch6',
    title: 'The Road to Semey',
    number: 6,
    objective: 'Choose a companion in the village, overcome the road ambush, and deliver the manuscript to the Alash leaders in the city.',
    reward: 20,
  },
};

export const CHAPTER_ORDER = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6'];

// Points that are not tied to evidence / deductions / chapters
export const BONUS_POINTS = {
  evidence: 5,
  deduction: 10,
  puzzle: 10,
  cipher: 10,
  secret: 5,          // trust-gated confessions
  finalChoice: 15,
  accusationMistake: -5,
};

// 4 Companion Candidates in the village for the journey to Semey
export const COMPANIONS = [
  {
    id: 'sadyk',
    name: 'Sadyk the Steppe Guide',
    title: 'Садық (Степной проводник)',
    desc: 'Boasts he knows secret steppe ravines to bypass any imperial patrol.',
    outcome: 'betrayal',
    flaw: 'Secretly conspired with the steppe ambushers to claim the imperial bounty.',
  },
  {
    id: 'mukhamet',
    name: 'Mukhamet the Scribe',
    title: 'Мұхамет (Писарь)',
    desc: 'Eloquent, educated clerk who claims devotion to enlightenment.',
    outcome: 'theft',
    flaw: 'Covets an imperial government rank and silver reward for turning in the copyists.',
  },
  {
    id: 'raiymbek',
    name: 'Raiymbek the Blacksmith',
    title: 'Райымбек (Кузнец, потомок батыров)',
    desc: 'Muscular craftsman who carries the battle spirit of Kazakh batyrs.',
    outcome: 'heroic',
    virtue: 'Fiercely loyal. Shatters the ambushers in combat and opens the frontier post.',
  },
  {
    id: 'dauletbai',
    name: 'Daulet-bai the Merchant',
    title: 'Дәулетбай (Богатый купец)',
    desc: 'Influential trade merchant with bags of gold rubles and governor permits.',
    outcome: 'diplomatic',
    virtue: 'Bribes the road ambushers and the checkpoint sentries without shedding blood.',
  },
];

export const FINAL_CHOICES = [
  {
    id: 'raiymbek',
    title: 'THE BATYR’S PATH',
    description: 'Rode with Raiymbek the Blacksmith. Fought through the steppe ambush.',
    detail: 'Raiymbek scattered the ambushers with batyr courage. The frontier guards dared not bar his path, and Abai’s heritage safely reached the Alash leaders in Semey.',
    ending: 'HEROIC GUARDIAN',
    endingText: 'The courage of the batyrs protected the wisdom of the Master.',
  },
  {
    id: 'dauletbai',
    title: 'THE DIPLOMAT’S PATH',
    description: 'Rode with Daulet-bai the Merchant. Bribed the ambushers and frontier post.',
    detail: 'Daulet-bai opened every gate with gold rubles and trade credentials. Blood was spared, and the Alash committee received the 12 copyists’ roster intact.',
    ending: 'PRAGMATIC ALLIANCE',
    endingText: 'Wisdom, influence and gold opened the road to freedom.',
  },
];

// Epilogue text per victory companion
export const EPILOGUES = {
  raiymbek: {
    high: 'Alikhan Bokeikhanov personally welcomed you and Raiymbek at the Semey headquarters. The 12 copyists were shielded by the Alash Orda, and Abai\'s words were published in thousands of copies. Raiymbek became one of the first protectors of the national militia.',
    low: 'You and Raiymbek delivered the manuscript through battle. The city welcomed the poems, though the village long remembered the tension on the road. The 12 copyists remained safe.',
  },
  dauletbai: {
    high: 'Daulet-bai funded the immediate typesetting of Abai’s verses in the Semey printing house. Alikhan and Akhmet Baitursynuly praised your alliance. Every copyist received financial support to continue their schools.',
    low: 'Daulet-bai’s bribes cleared your way to the Alash headquarters. The manuscripts were delivered safely, proving that pragmatism can serve noble ideals.',
  },
};

export const HISTORY_CARDS = [
  {
    title: '1909 — ABAI IN PRINT',
    text: 'The first collection of Abai Kunanbaiuly\'s poems was printed in St. Petersburg in 1909, five years after his death. Before that, his words lived in hand-made copies passed from village to village.',
  },
  {
    title: 'THE COPYISTS',
    text: 'Much of Abai\'s work survived because devoted scribes copied it by hand. These manuscripts are now treasured by scholars, and they remind us that heritage is kept by ordinary people.',
  },
  {
    title: '1917 — ALASH ORDA',
    text: 'Inspired by ideas of education and national identity, the Alash movement proclaimed the Alash Orda autonomy in December 1917. Its leaders included Alikhan Bukeikhanov, Akhmet Baitursynov and Mirzhakyp Dulatov.',
  },
  {
    title: 'SILENCE AND RETURN',
    text: 'In the 1930s most Alash leaders were repressed. Bukeikhanov and Baitursynov were executed in 1937. Their works were banned for decades and returned to readers only at the end of the 1980s.',
  },
];