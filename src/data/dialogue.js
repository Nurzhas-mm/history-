export const DIALOGUE = {
  elder: {
    greeting: [
      { speaker: 'Village Elder', text: 'Peace be upon you, young scholar. Our village carries stories older than the stones.' },
      { speaker: 'Village Elder', text: 'Listen carefully to the people here. In troubled times, truth is rarely spoken in the open.' }
    ],
    chapter2_interview: {
      intro: [
        { speaker: 'Village Elder', text: 'You ask about the night the archive room was unlocked?' },
        { speaker: 'Village Elder', text: 'I saw shadows by the door at dusk. But tell me first — what is your true purpose here?' }
      ],
      choices: [
        {
          key: 'A',
          label: 'I seek only to protect the Master\'s words and whoever wrote them.',
          trust: 15,
          reply: [
            { speaker: 'Village Elder', text: 'A noble heart. Then hear this: the third page was not stolen by a thief.' },
            { speaker: 'Village Elder', text: 'Someone removed it because the names written upon it could cost twelve good men their lives.' }
          ]
        },
        {
          key: 'B',
          label: 'The law requires that stolen archive properties be recovered.',
          trust: -10,
          reply: [
            { speaker: 'Village Elder', text: 'The law?' },
            { speaker: 'Village Elder', text: 'Imperial laws have banned the printing of our words for decades. If you serve their law, you will find no help from me.' }
          ]
        },
        {
          key: 'C',
          label: 'I am a neutral scholar cataloging the history of Semey.',
          trust: 5,
          reply: [
            { speaker: 'Village Elder', text: 'Neutrality is a luxury the steppe does not afford in 1910.' },
            { speaker: 'Village Elder', text: 'Still, an honest historian is better than a spy. Look near the old well before sunset.' }
          ]
        }
      ]
    },
    chapter4_start: [
      { speaker: 'Village Elder', text: 'Night has fallen. The village is quiet now, and I can speak what my heart holds.' },
      { speaker: 'Village Elder', text: 'Sabit, the copyist who penned those pages, was my brother in spirit.' },
      { speaker: 'Village Elder', text: 'Before he passed, he entrusted me with the roster of the twelve scribes who spread Abai’s poems across Semey and Karkaraly.' },
      { speaker: 'Village Elder', text: 'When the imperial inspectors arrived two days ago, I panicked. I took the page from the archive and buried it in an oiled packet under the flat foundation stone by the old well!' },
      { speaker: 'Village Elder', text: 'Go now in the shadows of the night. Recover it before morning.' }
    ],
    chapter5_prompt: [
      { speaker: 'Village Elder', text: 'Hurry to the old well. Search beneath the large flat stone on the south side of the rim.' }
    ],
    chapter5_shock: [
      { speaker: 'Village Elder', text: 'What?! The stone was moved and the oilcloth torn?!' },
      { speaker: 'Village Elder', text: 'Someone watched me hide it! Search around the well and the archive immediately!' }
    ],
    chapter6_start: [
      { speaker: 'Village Elder', text: 'The truth is laid bare. The Archivist acted out of terror, but his heart was true.' },
      { speaker: 'Village Elder', text: 'This sacred page with the twelve copyists\' names is too dangerous to keep in the village. If imperial gendarmes raid us, all twelve will be arrested.' },
      { speaker: 'Village Elder', text: 'You must carry the manuscript to the city of Semey, directly into the hands of the Alash party leaders!' },
      { speaker: 'Village Elder', text: 'They are gathering a national congress and setting up a typography to publish Abai’s heritage for the entire nation.' },
      { speaker: 'Village Elder', text: 'But beware: the Great Steppe Road is watched by armed ambushers, and the frontier post is guarded.' },
      { speaker: 'Village Elder', text: 'You cannot ride alone! Choose a reliable companion among the villagers — Sadyk the guide, Mukhamet the clerk, Raiymbek the blacksmith, or Daulet-bai the merchant.' },
      { speaker: 'Village Elder', text: 'Speak to them in the village, choose wisely, and ride east toward Semey!' }
    ]
  },

  teacher: {
    greeting: [
      { speaker: 'Teacher', text: 'Welcome to our humble school veranda. The children are copying verses from Abai today.' },
      { speaker: 'Teacher', text: 'Through literacy and knowledge, our people will find freedom.' }
    ],
    chapter2_interview: {
      intro: [
        { speaker: 'Teacher', text: 'You are investigating the missing manuscript leaf?' },
        { speaker: 'Teacher', text: 'I noticed things in the village, but knowledge can be a dangerous burden.' }
      ],
      choices: [
        {
          key: 'A',
          label: 'Abai wrote: "Hold knowledge above gold." Help me uncover what was taken.',
          trust: 15,
          reply: [
            { speaker: 'Teacher', text: 'You quote the Master well. Listen closely.' },
            { speaker: 'Teacher', text: 'I saw violet scribe ink near the cart yesterday — ink reserved strictly for master copyists recording secret rosters.' }
          ]
        },
        {
          key: 'B',
          label: 'If you conceal evidence, the archive authorities will shut your school.',
          trust: -10,
          reply: [
            { speaker: 'Teacher', text: 'You threaten a village teacher with gendarme authority?' },
            { speaker: 'Teacher', text: 'I have faced harsher threats than yours, young traveler. Good day.' }
          ]
        },
        {
          key: 'C',
          label: 'I only need to know who walked past your house last night.',
          trust: 5,
          reply: [
            { speaker: 'Teacher', text: 'Footsteps went toward the central well just before dawn. Someone carrying a bundle wrapped in felt.' }
          ]
        }
      ]
    },
    chapter3_start: [
      { speaker: 'Teacher', text: 'Search near my veranda and by the cart wheels. Copyists often tucked notes where only discerning eyes could spot them.' }
    ]
  },

  archivist: {
    greeting: [
      { speaker: 'Archivist', text: 'The archive contains records of deeds, poems, and family lineages.' },
      { speaker: 'Archivist', text: 'Every parchment must be preserved for future generations.' }
    ],
    chapter1_start: [
      { speaker: 'Archivist', text: 'Disaster! A sudden desert whirlwind scattered three loose folios of our precious manuscript across the village!' },
      { speaker: 'Archivist', text: 'Please, search the courtyards and bring all three pages back to me!' }
    ],
    chapter1_missing: [
      { speaker: 'Archivist', text: 'You recovered the pages! Let me examine them...' },
      { speaker: 'Archivist', text: 'Wait! Look at this final sheet... The edge was not torn by the wind!' },
      { speaker: 'Archivist', text: 'It was sliced out cleanly along the spine with a quill-knife! The final folio is missing!' },
      { speaker: 'Archivist', text: 'Someone deliberately stole the last page while the archive was sealed! Please, question the villagers!' }
    ],
    chapter2_interview: {
      intro: [
        { speaker: 'Archivist', text: 'You look at me with suspicion. Do you think I would damage my own collection?' }
      ],
      choices: [
        {
          key: 'A',
          label: 'I know you have dedicated your life to these books. I seek only the truth.',
          trust: 15,
          reply: [
            { speaker: 'Archivist', text: 'Thank you for seeing that. The truth is... I have been terrified.' },
            { speaker: 'Archivist', text: 'Rumors reached us that the imperial gendarmerie in Semey ordered all unregistered Kazakh manuscripts seized and burned.' }
          ]
        },
        {
          key: 'B',
          label: 'You were the only one holding the archive key. Confess now.',
          trust: -10,
          reply: [
            { speaker: 'Archivist', text: 'Confess?! To what, doing my duty under impossible fears?' },
            { speaker: 'Archivist', text: 'You know nothing of the burdens we carry in this steppe!' }
          ]
        },
        {
          key: 'C',
          label: 'Were any seals broken when you opened the door yesterday?',
          trust: 5,
          reply: [
            { speaker: 'Archivist', text: 'The wax seal had indeed cracked. Examine the threshold outside — bits of red wax still lie there.' }
          ]
        }
      ]
    },
    puzzleOffer: [
      { speaker: 'Archivist', text: 'Before you continue your search, could you help me organize the reference catalog?' },
      { speaker: 'Archivist', text: 'Matching the historical concepts will bring clarity to what we are trying to preserve.' }
    ],
    puzzleDone: [
      { speaker: 'Archivist', text: 'Exquisite work! Murseyit, Abai, Alash — you truly understand what we are fighting for.' },
      { speaker: 'Archivist', text: 'Take this knowledge into your investigation. It will serve you well.' }
    ],
    chapter5_busy: [
      { speaker: 'Archivist', text: 'I... I am completing an urgent inventory of the archives before the night carriage arrives. Please leave me be for a moment!' }
    ],
    chapter5_confront: [
      { speaker: 'Archivist', text: 'You found my traveling valise?! Please, lower your voice!' },
      { speaker: 'Archivist', text: 'I saw the Elder hide the page under the well stone at dawn. But the well is where everyone in the village gathers!' },
      { speaker: 'Archivist', text: 'If a single soldier kicks that stone, all twelve copyists will hang!' },
      { speaker: 'Archivist', text: 'I took it to put it in my travel chest. I booked the dawn carriage to Semey to deliver it directly to the Alash committee!' },
      { speaker: 'Archivist', text: 'Here — take it! The page is intact. You decide what must be done!' }
    ]
  },

  // 4 Companion Candidates
  sadyk: {
    greeting: [
      { speaker: 'Sadyk', text: 'Greetings, traveler. Looking for fast horses across the hills? Sadyk knows every hidden ridge.' }
    ],
    chapter6_offer: [
      { speaker: 'Sadyk', text: 'The Elder says you are riding to Semey with priceless manuscripts?' },
      { speaker: 'Sadyk', text: 'Listen to me: the main steppe road is dangerous, but I was born in these hills. I know secret gullies where no imperial patrol will ever spot us!' },
      { speaker: 'Sadyk', text: 'Take me as your companion, and by nightfall we will reach the city gates.' }
    ],
    accepted: [
      { speaker: 'Sadyk', text: 'A wise choice! Saddle your horse and follow my lead down the eastern pass!' }
    ]
  },

  mukhamet: {
    greeting: [
      { speaker: 'Mukhamet', text: 'Paper, stamps, official decrees. In the modern age, a clever pen is stronger than a blunt sword.' }
    ],
    chapter6_offer: [
      { speaker: 'Mukhamet', text: 'You carry Abai\'s original verses to the Alash leaders? My heart beats for enlightenment!' },
      { speaker: 'Mukhamet', text: 'I am a trained clerk. I speak Russian, understand legal decrees, and know how to talk our way past any gendarme officer.' },
      { speaker: 'Mukhamet', text: 'Choose me as your companion. With my intellect, no guard will dare delay us.' }
    ],
    accepted: [
      { speaker: 'Mukhamet', text: 'Splendid! I have packed my satchel. Let us ride to Semey together!' }
    ]
  },

  raiymbek: {
    greeting: [
      { speaker: 'Raiymbek', text: 'The forge fire burns hot. My ancestors were batyrs of the Middle Zhuz, and steel does not lie.' }
    ],
    chapter6_offer: [
      { speaker: 'Raiymbek', text: 'You must ride through the steppe canyon to deliver Abai\'s words to Alash?' },
      { speaker: 'Raiymbek', text: 'Listen well: cowards and bandits hunt along the border road like wolves. But my great-grandfather fought at Anyrakay, and my battle-saber has never bent.' },
      { speaker: 'Raiymbek', text: 'Take me with you! As long as Raiymbek breathes, no claw will touch the Master’s words!' }
    ],
    accepted: [
      { speaker: 'Raiymbek', text: 'Mount up, scholar! Let any dog cross our path and taste the fury of our ancestors!' }
    ]
  },

  dauletbai: {
    greeting: [
      { speaker: 'Daulet-bai', text: 'Trade caravans link Semey, Omsk and Bukhara. In this world, gold and connections open every locked door.' }
    ],
    chapter6_offer: [
      { speaker: 'Daulet-bai', text: 'Carrying the manuscript to Alikhan Bokeikhanov in Semey? A monumental mission!' },
      { speaker: 'Daulet-bai', text: 'I hold first-guild merchant credentials from the governor-general. Bandits want rubles, post sentries want silver.' },
      { speaker: 'Daulet-bai', text: 'Ride in my trade carriage. I will buy off any trouble on the road without shedding a drop of blood.' }
    ],
    accepted: [
      { speaker: 'Daulet-bai', text: 'Excellent! My carriage is harnessed and my purses full. Let us depart in style!' }
    ]
  },

  // Road Antagonist Encounter Cutscene
  antagonist_road: {
    sadyk_betrayal: [
      { speaker: 'Ambush Leader', text: 'Right on schedule, Sadyk! Did you bring the scholar and the papers?' },
      { speaker: 'Sadyk', text: 'Right behind me. Twelve names of Abai’s underground scribes. Hand over my purse of gold.' },
      { speaker: 'Player', text: 'Sadyk... you conspired with the ambushers?! You betrayed the village?!' },
      { speaker: 'Sadyk', text: 'Poems don’t buy sheep, scholar. Draw your blades, boys — leave no witnesses!' }
    ],
    mukhamet_theft: [
      { speaker: 'Ambush Leader', text: 'Halt! Dismount and surrender your belongings!' },
      { speaker: 'Mukhamet', text: 'Forgive me, scholar! The imperial gendarmes offered 500 rubles and a government post for the roster of copyists!' },
      { speaker: 'Mukhamet', text: '*Pulls a pistol, shoots your horse, snatches the satchel, and dashes toward the imperial outpost yelling for the police!*' },
      { speaker: 'Ambush Leader', text: 'The clerk sold you out, boy. You are under arrest!' }
    ],
    raiymbek_heroic: [
      { speaker: 'Ambush Leader', text: 'Halt where you stand! Hand over the manuscript bag or bleed in the dust!' },
      { speaker: 'Raiymbek', text: 'You cowardly hyenas dare block the wisdom of the Master?!' },
      { speaker: 'Raiymbek', text: '*Roars like a lion, drawing his gleaming ancestral forged saber and charging the line!*' },
      { speaker: 'Ambush Leader', text: 'He’s a batyr! He shattered my blade! Scatter into the hills, run for your lives!' },
      { speaker: 'Raiymbek', text: 'Run, jackals! The steppe road is cleared. Ride forward, scholar — the post is ahead!' }
    ],
    dauletbai_diplomatic: [
      { speaker: 'Ambush Leader', text: 'Pay the highway ransom or your journey ends in this ravine!' },
      { speaker: 'Daulet-bai', text: 'Calm yourselves, gentlemen. Blood stains fine Bukhara silk. Let us speak in a language all wise men understand.' },
      { speaker: 'Daulet-bai', text: '*Tosses heavy jingling purses of gold imperial chervontsy to the bandit leader!*' },
      { speaker: 'Daulet-bai', text: 'A full year\'s wages each. Ride back to your yurts, buy cattle, and forget you ever saw our carriage.' },
      { speaker: 'Ambush Leader', text: 'Pure imperial gold... A thousand blessings, respected Bai! The road is completely open!' }
    ]
  },

  // Frontier Post sentry
  post_sentry: {
    raiymbek_pass: [
      { speaker: 'Post Officer', text: 'H-halt... Wait! Are you the blacksmith who just routed twelve armed ambushers with bare hands?!' },
      { speaker: 'Raiymbek', text: 'We ride on urgent matters of national heritage to Semey. Lift the turnpike!' },
      { speaker: 'Post Officer', text: 'Y-yes, Batyr! Raise the barrier immediately! Safe travels!' }
    ],
    dauletbai_pass: [
      { speaker: 'Post Officer', text: 'Halt! Frontier customs checkpoint. Declare your cargo!' },
      { speaker: 'Daulet-bai', text: '*Presents First-Guild Governor trade credentials and slips a sealed velvet purse of silver to the officer.*' },
      { speaker: 'Daulet-bai', text: 'Official cultural archive delegation of Daulet-bai. Everything is inspected and certified.' },
      { speaker: 'Post Officer', text: 'All credentials in perfect order, Daulet-bai-myrza! Salute and open the gate for Semey!' }
    ]
  },

  // Alash Leader in Semey City
  alash_leader: {
    arrival: [
      { speaker: 'Alikhan Bokeikhanov', text: 'Welcome to Semey, brave scholar! Word reached us through the steppe that Abai’s final manuscripts were being pursued!' },
      { speaker: 'Player', text: 'We brought the sacred page through the steppe road! Here are the verses of Abai and the roster of the twelve living copyists.' },
      { speaker: 'Alikhan Bokeikhanov', text: 'This is a historic victory for our nation! The Alash Orda will print these poems in our typography, and the newspaper "Qazaq" will distribute them across the entire steppe!' },
      { speaker: 'Alikhan Bokeikhanov', text: 'The names of these twelve copyists will be inscribed with gold into the chronicle of our national awakening. You have saved the soul of our people!' }
    ]
  },

  // Clue reactions when presenting evidence to NPCs
  reactions: {
    elder: {
      secret_photo: '1895... Sabit, me, and the archivist. We were young scholars, reading Abai\'s notebooks by candle-light. We swore a sacred oath under the open steppe sky to guard the flame forever.',
      ink_bottle: 'Violet lampblack ink. Sabit bought that bottle in Semey fifteen years ago to write the roster of scribes.',
      torn_manuscript: 'The clean cut of a quill knife. Someone removed it to protect the names, not out of malice.',
      broken_seal: 'The archive seal was pried loose with a key. Only the Archivist and I hold keys to that door.',
      default: 'An interesting clue, but it does not tell the full story. Keep searching.'
    },
    teacher: {
      ink_bottle: 'This violet ink was prepared exclusively by Murseyit in Semey! He used it so verses would not fade through bitter winter frosts. It proves the page is authentic!',
      secret_photo: 'Remarkable! The young men in this photograph laid the foundations for literacy across our entire region.',
      old_letter: 'These handwriting notes match the copyists\' registry! The twelve names were real living people across our districts.',
      default: 'I have not seen this item before, but catalog it carefully in your case file.'
    },
    archivist: {
      cache_marks: 'You found where the Elder placed it?! I swear by the memory of Abai, I moved it only to shield the twelve copyists from gendarme exile!',
      archivist_chest: 'My traveling valise... Yes, I booked the morning carriage to Semey. I intended to deliver it to Alikhan myself!',
      broken_seal: 'Please... do not show that so openly. My hand shook when I unlocked the cabinet yesterday.',
      default: 'I do not recognize this piece. The archive holds thousands of relics.'
    },
    sadyk: {
      torn_manuscript: 'Old paper with calligraphy? Hand it over, I can tuck it into my saddlebag where it won\'t get wrinkled...',
      default: 'I am a herdsman, scholar. Clues and ink mean little to me — only swift horses and open trails.'
    },
    mukhamet: {
      old_letter: 'Fascinating script... Such registries are worth a small fortune to imperial commissioners seeking illegal printing circles.',
      default: 'A curious artifact. As a scribe, I admire old documents.'
    },
    raiymbek: {
      secret_photo: 'My father spoke of Sabit and the scholars. Real men who held their ground against tyranny without fear.',
      torn_manuscript: 'The words of Abai are sharper than any blade. I will defend this parchment with my life.',
      default: 'Keep it safe, scholar. Trust only those with clean hearts.'
    },
    dauletbai: {
      old_letter: 'A roster of living copyists? In Semey, the Alash party leaders will value this higher than a chest of pearls.',
      secret_photo: 'I knew Sabit when he traded books in the Semey bazaar. A man of iron principles.',
      default: 'Valuable evidence. Present it to the Alash committee when we reach the city.'
    }
  }
};

export const INTERVIEW_CHOICES = {
  elder: DIALOGUE.elder.chapter2_interview,
  teacher: DIALOGUE.teacher.chapter2_interview,
  archivist: DIALOGUE.archivist.chapter2_interview
};