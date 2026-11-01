export type Language = 'fr' | 'en';

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
  /** Highest training room completed (0 = none, 3 = training done). */
  readonly trainingDone: number;
  readonly dailyStreak: number;
  readonly lastDailyWon: string | null;
  /** Last daily prismjack finished, won or caught: the app then opens on a free prismjack. */
  readonly lastDailyPlayed: string | null;
  readonly settings: Settings;
}

export const NO_PROGRESS: Progress = {
  prismjacksWon: 0,
  perfectPrismjacks: 0,
  trainingDone: 0,
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
