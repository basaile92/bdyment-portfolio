export type Language = 'fr' | 'en';

export interface Settings {
  readonly sound: boolean;
  /** Absent until the player picks one (first launch). */
  readonly language?: Language;
}

export interface Progress {
  readonly heistsWon: number;
  readonly perfectHeists: number;
  /** Highest training room completed (0 = none, 3 = training done). */
  readonly trainingDone: number;
  readonly dailyStreak: number;
  readonly lastDailyWon: string | null;
  /** Last daily heist finished, won or caught: the app then opens on a free heist. */
  readonly lastDailyPlayed: string | null;
  readonly settings: Settings;
}

export const NO_PROGRESS: Progress = {
  heistsWon: 0,
  perfectHeists: 0,
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
