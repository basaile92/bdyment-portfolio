import { NO_PROGRESS, type Progress, type ProgressStore } from '../ports/ProgressStore';

export function merge(saved: Partial<Progress>): Progress {
  return { ...NO_PROGRESS, ...saved, settings: { ...NO_PROGRESS.settings, ...saved.settings } };
}

/** Browser storage. Storage can be missing or throw (private mode, sandbox): fail soft. */
export class WebProgressStore implements ProgressStore {
  constructor(private readonly key = 'le-casse/progress') {}

  async load(): Promise<Progress> {
    try {
      const raw = globalThis.localStorage?.getItem(this.key);
      return raw ? merge(JSON.parse(raw) as Partial<Progress>) : NO_PROGRESS;
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
