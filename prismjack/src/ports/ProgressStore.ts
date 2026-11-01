export type Language = 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh';

export interface Settings {
  readonly sound: boolean;
  /** Absent until the player picks one (first launch). */
  readonly language?: Language;
  /** A shape per jewel colour, for players who tell colours apart poorly. Off unless chosen. */
  readonly symbols?: boolean;
}

export interface Progress {
  readonly prismjacksWon: number;
  readonly perfectPrismjacks: number;
  /** Campaign levels won (indices); the next one after the highest is unlocked. */
  readonly levelsWon: readonly number[];
  /** Best endless run: rooms cleared before the first failure. */
  readonly runBest: number;
  readonly dailyStreak: number;
  readonly lastDailyWon: string | null;
  /** Last daily prismjack finished, won or caught: the app then opens on a free prismjack. */
  readonly lastDailyPlayed: string | null;
  readonly settings: Settings;
}

export const NO_PROGRESS: Progress = {
  prismjacksWon: 0,
  perfectPrismjacks: 0,
  levelsWon: [],
  runBest: 0,
  dailyStreak: 0,
  lastDailyWon: null,
  lastDailyPlayed: null,
  settings: { sound: true },
};

/** Where the player's progress is kept (browser storage, native preferences…). */
export interface ProgressStore {
  load(): Promise<Progress>;
  save(progress: Progress): Promise<void>;
}
