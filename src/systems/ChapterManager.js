import Phaser from 'phaser';
import { CHAPTERS, CHAPTER_ORDER } from '../data/chapters.js';
import { EVIDENCE, DEDUCTION_PAIRS } from '../data/evidence.js';

export default class ChapterManager {
  constructor() {
    this.activeChapterId = 'ch1';
    this.completedChapters = [];
    this.heritagePoints = 0;
    this.chapterProgress = {};
    this.interviewedNPCs = [];
    this.collectedFragments = [];

    // Evidence system
    this.evidence = {};
    this.deductions = [];

    // Puzzle minigame
    this.puzzleSolved = false;

    // Trust system
    this.trust = {
      elder: 65,
      teacher: 50,
      archivist: 45
    };

    // Day/night
    this.isEvening = false;
    this.finalChoice = null;
    this.companion = null;
    this.checkpointPassed = false;

    this.initChapters();
    this.initEvidence();
  }

  initChapters() {
    CHAPTER_ORDER.forEach(id => {
      this.chapterProgress[id] = 0;
    });
  }

  initEvidence() {
    EVIDENCE.forEach(e => {
      this.evidence[e.id] = {
        ...e,
        found: false
      };
    });
  }

  // Chapter methods
  getActiveChapter() {
    const ch = CHAPTERS[this.activeChapterId];
    if (!ch) return null;
    return {
      ...ch,
      progress: this.chapterProgress[this.activeChapterId] || 0
    };
  }

  isChapterActive(chapterId) {
    return this.activeChapterId === chapterId;
  }

  isChapterCompleted(chapterId) {
    return this.completedChapters.includes(chapterId);
  }

  addChapterProgress(amount = 1) {
    this.chapterProgress[this.activeChapterId] =
      (this.chapterProgress[this.activeChapterId] || 0) + amount;
    return this.chapterProgress[this.activeChapterId];
  }

  getChapterProgress() {
    return this.chapterProgress[this.activeChapterId] || 0;
  }

  // Fragment tracking for Chapter 1
  isFragmentCollected(fragmentId) {
    return this.collectedFragments.includes(fragmentId);
  }

  collectFragment(fragmentId) {
    if (!this.collectedFragments.includes(fragmentId)) {
      this.collectedFragments.push(fragmentId);
      this.chapterProgress['ch1'] = this.collectedFragments.length;
      this.saveState();
      return true;
    }
    return false;
  }

  completeChapter(chapterId) {
    const ch = CHAPTERS[chapterId];
    if (!ch || this.completedChapters.includes(chapterId)) return null;

    this.completedChapters.push(chapterId);
    this.heritagePoints += ch.reward;

    const currentIndex = CHAPTER_ORDER.indexOf(chapterId);
    const nextId = CHAPTER_ORDER[currentIndex + 1] || null;

    if (nextId) {
      this.activeChapterId = nextId;
      this.chapterProgress[nextId] = 0;
    } else {
      this.activeChapterId = null;
    }

    this.saveState();
    return { chapter: ch, nextChapterId: nextId };
  }

  allChaptersComplete() {
    return CHAPTER_ORDER.every(id => this.completedChapters.includes(id));
  }

  // Evidence methods
  discoverEvidence(evidenceId) {
    if (this.evidence[evidenceId] && !this.evidence[evidenceId].found) {
      this.evidence[evidenceId].found = true;
      const e = this.evidence[evidenceId];
      this.heritagePoints += 5;
      this.saveState();
      return e;
    }
    return null;
  }

  getEvidence() {
    return Object.values(this.evidence);
  }

  getFoundEvidence() {
    return Object.values(this.evidence).filter(e => e.found);
  }

  getEvidenceCount() {
    return this.getFoundEvidence().filter(e => !e.optional).length;
  }

  tryDeduction(evidenceId1, evidenceId2) {
    const pair = DEDUCTION_PAIRS.find(p =>
      (p.pair[0] === evidenceId1 && p.pair[1] === evidenceId2) ||
      (p.pair[0] === evidenceId2 && p.pair[1] === evidenceId1)
    );

    if (pair) {
      if (!this.deductions.find(d => d.result === pair.result)) {
        this.deductions.push({
          evidence1: pair.pair[0],
          evidence2: pair.pair[1],
          result: pair.result
        });
        this.heritagePoints += 10;
        this.saveState();
        return { success: true, result: pair.result, new: true };
      }
      return { success: true, result: pair.result, new: false };
    }
    return { success: false };
  }

  getDeductions() {
    return this.deductions;
  }

  getDeductionCount() {
    return this.deductions.length;
  }

  hasDeduction(partialText) {
    return this.deductions.some(d => d.result.toLowerCase().includes(partialText.toLowerCase()));
  }

  // Trust methods
  adjustTrust(npcId, amount) {
    if (this.trust[npcId] !== undefined) {
      this.trust[npcId] = Phaser.Math.Clamp(this.trust[npcId] + amount, 0, 100);
      this.saveState();
      return this.trust[npcId];
    }
    return null;
  }

  getTrust(npcId) {
    return this.trust[npcId] || 0;
  }

  getAverageTrust() {
    return Math.round((this.trust.elder + this.trust.teacher + this.trust.archivist) / 3);
  }

  isNPCInterviewed(npcId) {
    return this.interviewedNPCs.includes(npcId);
  }

  markNPCInterviewed(npcId) {
    if (!this.interviewedNPCs.includes(npcId)) {
      this.interviewedNPCs.push(npcId);
      this.saveState();
    }
  }

  getInterviewedCount() {
    return this.interviewedNPCs.length;
  }

  // Day/night
  setEvening(val) {
    this.isEvening = val;
    this.saveState();
  }

  // Puzzle
  solvePuzzle() {
    if (!this.puzzleSolved) {
      this.puzzleSolved = true;
      this.heritagePoints += 20;
      this.saveState();
    }
  }

  // Final choice
  setFinalChoice(choiceId) {
    this.finalChoice = choiceId;
    this.heritagePoints += 10;
    this.saveState();
  }

  getFinalChoice() {
    return this.finalChoice;
  }

  // Points
  addPoints(amount) {
    this.heritagePoints += amount;
    this.saveState();
  }

  getPoints() {
    return this.heritagePoints;
  }

  getRank() {
    if (this.heritagePoints >= 80) return 'HERITAGE KEEPER';
    if (this.heritagePoints >= 50) return 'ARCHIVE SCHOLAR';
    return 'CURIOUS RESEARCHER';
  }

  // Companion system for Chapter 6
  setCompanion(companionId) {
    this.companion = companionId;
    this.saveState();
  }

  getCompanion() {
    return this.companion;
  }

  clearCompanion() {
    this.companion = null;
    this.saveState();
  }

  passCheckpoint() {
    this.checkpointPassed = true;
    this.saveState();
  }

  isCheckpointPassed() {
    return this.checkpointPassed;
  }

  markCluePresented(npcKey, clueId) {
    if (!this.presentedClues) this.presentedClues = {};
    const key = `${npcKey}_${clueId}`;
    if (!this.presentedClues[key]) {
      this.presentedClues[key] = true;
      this.saveState();
      return true;
    }
    return false;
  }

  isCluePresented(npcKey, clueId) {
    if (!this.presentedClues) return false;
    return !!this.presentedClues[`${npcKey}_${clueId}`];
  }

  // Save/load
  saveState() {
    const data = {
      activeChapterId: this.activeChapterId,
      completedChapters: this.completedChapters,
      heritagePoints: this.heritagePoints,
      chapterProgress: this.chapterProgress,
      interviewedNPCs: this.interviewedNPCs,
      collectedFragments: this.collectedFragments,
      evidence: {},
      deductions: this.deductions,
      puzzleSolved: this.puzzleSolved,
      trust: this.trust,
      isEvening: this.isEvening,
      finalChoice: this.finalChoice,
      companion: this.companion,
      checkpointPassed: this.checkpointPassed,
      presentedClues: this.presentedClues || {}
    };
    Object.keys(this.evidence).forEach(k => {
      data.evidence[k] = this.evidence[k].found;
    });
    try {
      localStorage.setItem('archives_of_alash_save', JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  reset() {
    this.activeChapterId = 'ch1';
    this.completedChapters = [];
    this.heritagePoints = 0;
    this.chapterProgress = {};
    this.interviewedNPCs = [];
    this.collectedFragments = [];
    this.evidence = {};
    this.deductions = [];
    this.puzzleSolved = false;
    this.trust = { elder: 65, teacher: 50, archivist: 45 };
    this.isEvening = false;
    this.finalChoice = null;
    this.companion = null;
    this.checkpointPassed = false;
    this.presentedClues = {};
    this.initChapters();
    this.initEvidence();
    this.clearSave();
  }

  loadState() {
    try {
      const raw = localStorage.getItem('archives_of_alash_save');
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.completedChapters && data.completedChapters.includes('ch6')) {
        this.clearSave();
        return false;
      }
      this.activeChapterId = data.activeChapterId || 'ch1';
      this.completedChapters = data.completedChapters || [];
      this.heritagePoints = data.heritagePoints || 0;
      this.chapterProgress = data.chapterProgress || {};
      this.interviewedNPCs = data.interviewedNPCs || [];
      this.collectedFragments = data.collectedFragments || [];
      if (this.collectedFragments.length > 0) {
        this.chapterProgress['ch1'] = this.collectedFragments.length;
      }
      this.deductions = data.deductions || [];
      this.puzzleSolved = data.puzzleSolved || false;
      this.trust = data.trust || { elder: 65, teacher: 50, archivist: 45 };
      this.isEvening = data.isEvening || false;
      this.finalChoice = data.finalChoice || null;
      if (this.activeChapterId === 'ch6') {
        this.companion = data.companion || null;
        this.checkpointPassed = data.checkpointPassed || false;
      } else {
        this.companion = null;
        this.checkpointPassed = false;
      }
      this.presentedClues = data.presentedClues || {};
      if (data.evidence) {
        Object.keys(data.evidence).forEach(k => {
          if (this.evidence[k]) {
            this.evidence[k].found = data.evidence[k];
          }
        });
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  clearSave() {
    try {
      localStorage.removeItem('archives_of_alash_save');
    } catch (e) {}
  }

  hasSave() {
    try {
      return !!localStorage.getItem('archives_of_alash_save');
    } catch (e) {
      return false;
    }
  }
}
