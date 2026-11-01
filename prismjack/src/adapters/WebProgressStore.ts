import { NO_PROGRESS, type Progress, type ProgressStore } from '../ports/ProgressStore';

/** Progress saved before the game was renamed Prismjack used "heist" field names. */
export type LegacyProgress = Partial<Progress> & { heistsWon?: number; perfectHeists?: number };

export function merge(saved: LegacyProgress): Progress {
  const { heistsWon, perfectHeists, ...rest } = saved;
  const renamed = {
    ...(heistsWon !== undefined && rest.prismjacksWon === undefined ? { prismjacksWon: heistsWon } : {}),
    ...(perfectHeists !== undefined && rest.perfectPrismjacks === undefined ? { perfectPrismjacks: perfectHeists } : {}),
  };
  return { ...NO_PROGRESS, ...rest, ...renamed, settings: { ...NO_PROGRESS.settings, ...rest.settings } };
}

/** Browser storage. Storage can be missing or throw (private mode, sandbox): fail soft. */
export class WebProgressStore implements ProgressStore {
  constructor(private readonly key = 'le-casse/progress') {}

  async load(): Promise<Progress> {
    try {
      const raw = globalThis.localStorage?.getItem(this.key);
      return raw ? merge(JSON.parse(raw) as LegacyProgress) : NO_PROGRESS;
    } catch {
      return NO_PROGRESS;
    }
  }

  async save(progress: Progress): Promise<void> {
    try {
      globalThis.localStorage?.setItem(this.key, JSON.stringify(progress));
    } catch {
      /* storage unavailable: progress is simply not kept */
    }
  }
}
