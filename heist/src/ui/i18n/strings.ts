import type { JewelColor } from '../../domain';
import type { Language } from '../../ports/ProgressStore';
import { en } from './en';
import { fr } from './fr';

export type { Language };

export const LANGUAGES: readonly { readonly id: Language; readonly name: string }[] = [
  { id: 'fr', name: 'Français' },
  { id: 'en', name: 'English' },
];

/** The browser's language when it is one we speak, English otherwise. */
export function detectLanguage(browser: string | undefined): Language {
  return browser?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function stringsFor(language: Language): Strings {
  return language === 'fr' ? fr : en;
}

type TrainingLevel = 1 | 2 | 3;
type Side = 'top' | 'bottom' | 'left' | 'right';

/**
 * Every word the game shows. Texts with **double stars** are rendered with those parts in bold.
 * Functions take the numbers they need, so each language handles its own plurals.
 */
export interface Strings {
  readonly colors: Record<JewelColor, string>;
  /** Laser colour names, indexed by colour mask (0 = transparent). */
  readonly laserNames: readonly string[];

  readonly title: string;
  readonly modeTraining: (level: TrainingLevel) => string;
  readonly modeDaily: (dayMonth: string) => string;
  readonly modeFree: string;
  readonly menuButton: string;
  readonly settingsButton: string;
  readonly helpButton: string;

  readonly room: string;
  readonly boardLabel: string;
  readonly cellAt: (column: number, row: number) => string;
  readonly emitterAt: (index: number, side: Side) => string;
  readonly announceShot: (back: boolean, color: string) => string;

  readonly speech: {
    readonly intro: string;
    readonly shot: (n: number, back: boolean) => string;
    readonly cleared: string;
    readonly emptyPlan: string;
    readonly alarm: string;
    readonly alarmUp: (level: number) => string;
    readonly caught: string;
    readonly successLead: string;
    readonly successRest: string;
  };
  readonly trainingStart: Record<TrainingLevel, string>;
  readonly tips: {
    readonly firstShot: string;
    readonly colored: string;
    readonly transparent: string;
    readonly back: string;
    readonly firstDraw: string;
    readonly jewelDrawn: string;
    readonly allDrawn: string;
  };

  readonly gaugeLabel: string;
  readonly tests: (n: number) => string;
  readonly quietUntil: (n: number) => string;
  readonly alarmHint: string;
  readonly alarmLevel: (n: number) => string;

  readonly loot: string;
  readonly lootLabel: (found: number, total: number) => string;
  readonly jewelNamed: (color: string) => string;

  readonly trace: string;
  readonly empty: string;
  readonly undo: string;
  readonly redo: string;
  readonly clearPlan: string;
  readonly jewelColorGroup: string;
  readonly go: string;
  readonly goSub: string;
  readonly next: string;
  readonly nextHeist: string;
  readonly freeHeist: string;
  readonly retry: string;

  readonly welcomeTitle: string;
  readonly welcomeText: string;
  readonly welcomeKnow: string;
  readonly welcomeLearn: string;
  readonly tutorialTrain: string;
  readonly tutorialPlay: string;
  readonly languageLabel: string;

  readonly clearTitle: string;
  readonly clearText: string;
  readonly keep: string;
  readonly erase: string;
  readonly incompleteTitle: string;
  readonly incompleteText: (missing: number) => string;
  readonly continuePlan: string;
  readonly goAnyway: string;

  readonly winTitle: string;
  readonly winAlarmLabel: (level: number) => string;
  readonly winText: (tests: number, level: number) => string;
  readonly winVerdict: (level: number) => string;
  readonly streakLine: (streak: number, nextIn: string) => string;
  readonly copied: string;
  readonly copyResult: string;
  readonly seeRoom: string;
  readonly caughtTitle: string;
  readonly caughtText: (daily: boolean) => string;
  readonly caughtDaily: (nextIn: string) => string;
  readonly shareLabel: (dayMonthYear: string | null) => string;
  readonly shareText: (label: string, lamps: string, tests: number, level: number) => string;
  readonly duration: (hours: number, minutes: number) => string;

  readonly menuTitle: string;
  readonly menuAbandon: string;
  readonly dailyTitle: (state: 'open' | 'won' | 'lost') => string;
  readonly dailyOpen: string;
  readonly dailyDone: (nextIn: string) => string;
  readonly streak: (days: number) => string;
  readonly freeTitle: string;
  readonly freeText: string;
  readonly trainingTitle: string;
  readonly trainingJewels: (n: number) => string;
  readonly trainingDone: string;
  readonly trainingTodo: string;
  readonly stats: (won: number, perfect: number) => string;

  readonly settingsTitle: string;
  readonly sound: string;
  readonly symbols: string;
  readonly symbolsSub: string;
  readonly helpSymbols: string;
  readonly soundSub: string;
  readonly language: string;
  readonly resetTitle: string;
  readonly resetSub: string;
  readonly resetSure: string;
  readonly cancel: string;
  readonly reset: string;
  readonly close: string;

  readonly helpTitle: string;
  readonly helpGoal: string;
  readonly helpGoalText: string;
  readonly helpTest: string;
  readonly helpTestText: string;
  readonly helpWalls: string;
  readonly helpWall: string;
  readonly helpFacet: string;
  readonly helpColors: string;
  readonly helpColorsText: string;
  readonly helpDraw: string;
  readonly helpDrawText: string;
  readonly helpAlarm: string;
  readonly helpAlarmText: string;
  readonly gotIt: string;
  readonly previous: string;
  readonly next2: string;
  readonly helpPage: (page: number, total: number) => string;
}
