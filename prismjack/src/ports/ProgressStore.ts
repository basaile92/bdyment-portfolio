import type { FacetOrientation, JewelColor, PortId, StoredRoom, SurfaceKey } from '../domain';

export type Language = 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh';

/**
 * A run in progress, kept so it can be picked up later (same browser, same phone): the room itself
 * (not its index, so it survives new room pools), the torches lit in order, the drawing, the empty marks
 * and the wrong plans. `room` is null between two rooms: the next one is drawn when resuming.
 */
export interface SavedRun {
  readonly step: number;
  readonly room: { readonly stored: StoredRoom; readonly variant: number } | null;
  readonly shots: readonly PortId[];
  readonly plan: readonly (readonly [SurfaceKey, JewelColor, FacetOrientation?])[];
  readonly empties: readonly number[];
  readonly wrongPlans: number;
}

export interface Settings {
  readonly sound: boolean;
  /** Absent until the player picks one (first launch). */
  readonly language?: Language;
  /** A shape per jewel colour, for players who tell colours apart poorly. Off unless chosen. */
  readonly symbols?: boolean;
  /** Vibrations on tests, drawing and alarms (phones). On unless turned off. */
  readonly haptics?: boolean;
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
  /** Lessons of the tutorial finished (the tutorial button resumes at the next one). */
  readonly lessonReached?: number;
  /** The run in progress, if any (resumed from the home menu). */
  readonly run?: SavedRun | null;
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
