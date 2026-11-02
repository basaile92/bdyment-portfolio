import type { TutorialPage } from './tutorial';
import type { JewelColor } from '../../domain';
import type { Language } from '../../ports/ProgressStore';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';
import { ja } from './ja';
import { ko } from './ko';
import { pt } from './pt';
import { zh } from './zh';

export type { Language };

export const LANGUAGES: readonly { readonly id: Language; readonly name: string }[] = [
  { id: 'fr', name: 'Français' },
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Español' },
  { id: 'de', name: 'Deutsch' },
  { id: 'it', name: 'Italiano' },
  { id: 'pt', name: 'Português' },
  { id: 'ja', name: '日本語' },
  { id: 'ko', name: '한국어' },
  { id: 'zh', name: '中文' },
];

const STRINGS: Record<Language, Strings> = { fr, en, es, de, it, pt, ja, ko, zh };

/** The browser's language when it is one we speak (any Chinese reads the traditional one), English otherwise. */
export function detectLanguage(browser: string | undefined): Language {
  const code = browser?.toLowerCase().slice(0, 2);
  return LANGUAGES.find((l) => l.id === code)?.id ?? 'en';
}

export function stringsFor(language: Language): Strings {
  return STRINGS[language] ?? en;
}

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
  /** Sentence-final punctuation ('.' or '。'). */
  readonly fullStop: string;
  /** Space between two sentences of a speech bubble ('' in Japanese and Chinese). */
  readonly sentenceGap: string;
  readonly modeDaily: (dayMonth: string) => string;
  readonly modeLesson: (lesson: number, total: number) => string;
  /** The playable tutorial: one line per lesson step (see application/lessons). */
  readonly lessons: readonly (readonly string[])[];
  readonly lessonNudge: string;
  readonly lessonSkip: string;
  /** Coach line once a lesson's heist succeeded; `next` is the continue button's label. */
  readonly lessonWon: (next: string) => string;
  /** Coach line after the last lesson: the rules in one breath, and the button to press. */
  readonly tutorialDone: (next: string) => string;
  /** Coach feedback in a lesson: a wrong plan (alarm level reached), a GO with nothing drawn. */
  readonly lessonWrongPlan: (level: number) => string;
  readonly lessonEmptyPlan: string;
  /** Touch screens: the drawing step of lessons 1 and 2, saying how to aim (press and hold, loupe, slide, let go). */
  readonly lessonDrawTouch: readonly string[];
  readonly nextLesson: string;
  readonly firstLevel: string;
  readonly modeLevel: (n: number) => string;
  readonly modeRun: (room: number) => string;
  /** Home menu and level map. */
  readonly home: {
    readonly tagline: string;
    readonly appStore: string;
    readonly appGet: string;
    readonly appClose: string;
    readonly levels: string;
    readonly levelsSub: (won: number, total: number) => string;
    readonly daily: string;
    readonly dailyOpen: string;
    readonly dailyDone: (next: string) => string;
    readonly streak: (n: number) => string;
    readonly run: string;
    readonly runResume: (room: number) => string;
    readonly runSub: (best: number) => string;
    readonly tutorial: string;
    readonly tutorialSub: string;
    readonly settings: string;
    readonly easy: string;
    readonly medium: string;
    readonly hard: string;
    readonly extreme: string;
    readonly nightmare: string;
    readonly locked: string;
    readonly levelLabel: (n: number, state: 'won' | 'open' | 'locked') => string;
  };
  readonly runOver: (rooms: number, best: number) => string;
  /** What each of the first levels teaches, said by the thief when it opens. */
  readonly levelIntro: readonly string[];
  /** Level 31, the first with the tiniest jewels (a single cell, half a cell). */
  readonly tinyJewelsIntro: string;
  readonly levelGeneric: (n: number) => string;
  readonly dailyIntro: string;
  readonly runIntro: (room: number) => string;
  readonly backHome: string;
  /** Shown over a room when the window is too small to play. */
  readonly tooSmallTitle: string;
  readonly tooSmallText: string;
  readonly nextRoom: string;
  readonly newRun: string;
  readonly nextLevel: string;
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
    readonly absorbed: (n: number) => string;
    readonly cleared: string;
    readonly emptyPlan: string;
    readonly alarm: string;
    readonly alarmUp: (level: number) => string;
    /** After a wrong plan: one torch is circled in red. */
    readonly mismatch: string;
    readonly caught: string;
    readonly successLead: string;
    readonly successRest: string;
  };
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
  readonly eraser: string;
  readonly undo: string;
  readonly redo: string;
  readonly clearPlan: string;
  readonly jewelColorGroup: string;
  readonly go: string;
  readonly goSub: string;
  readonly next: string;
  readonly retry: string;

  readonly welcomeTitle: string;
  readonly welcomeText: string;
  readonly welcomeKnow: string;
  readonly welcomeLearn: string;
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
  /** Sharing failed: the text is shown to copy by hand. */
  readonly shareManual: string;
  /** Unexpected error screen. */
  readonly crashTitle: string;
  readonly crashText: string;
  readonly crashCopy: string;
  readonly crashReload: string;
  readonly crashContinue: string;
  readonly seeRoom: string;
  readonly caughtTitle: string;
  readonly caughtText: (daily: boolean) => string;
  readonly shareDailyTitle: (dayMonthYear: string | null) => string;
  readonly shareWon: (tests: number, lamps: string) => string;
  readonly shareCaught: (tests: number) => string;
  readonly shareStreak: (days: number) => string;
  readonly shareRunTitle: string;
  readonly shareRun: (rooms: number, best: number) => string;
  readonly shareCardWon: (tests: number) => string;
  readonly shareCardCaught: (tests: number) => string;
  readonly shareCardRun: (rooms: number) => string;
  readonly shareCardBest: (best: number) => string;
  readonly share: string;
  readonly shared: string;
  readonly duration: (hours: number, minutes: number) => string;

  readonly dailyOpen: string;
  readonly dailyDone: (nextIn: string) => string;
  readonly streak: (days: number) => string;
  readonly settingsTitle: string;
  readonly sound: string;
  readonly symbols: string;
  readonly symbolsSub: string;
  readonly soundSub: string;
  readonly haptics: string;
  readonly hapticsSub: string;
  readonly language: string;
  readonly resetTitle: string;
  readonly resetSub: string;
  readonly resetSure: string;
  readonly cancel: string;
  readonly reset: string;
  readonly close: string;

  readonly helpTitle: string;
  readonly tutorialPages: readonly TutorialPage[];
  readonly tutorialWallTap: string;
  readonly tutorialFacetTap: string;
  readonly gotIt: string;
  readonly previous: string;
  readonly next2: string;
  readonly helpPage: (page: number, total: number) => string;
}
