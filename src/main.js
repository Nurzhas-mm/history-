import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import IntroScene from './scenes/IntroScene.js';
import GameScene from './scenes/GameScene.js';
import PuzzleScene from './scenes/PuzzleScene.js';
import EvidenceBoardScene from './scenes/EvidenceBoardScene.js';
import FinalChoiceScene from './scenes/FinalChoiceScene.js';
import FinalScene from './scenes/FinalScene.js';
import CampaignScene from './scenes/CampaignScene.js';
import EcoScene from './scenes/EcoScene.js';
import EcoMiniGameScene from './scenes/EcoMiniGameScene.js';
import EcoFinalScene from './scenes/EcoFinalScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#1a0a00',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, IntroScene, GameScene, PuzzleScene, EvidenceBoardScene, FinalChoiceScene, FinalScene, CampaignScene, EcoScene, EcoMiniGameScene, EcoFinalScene],
};

const game = new Phaser.Game(config);