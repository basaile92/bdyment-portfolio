import { Preferences } from '@capacitor/preferences';
import { NO_PROGRESS, type Progress, type ProgressStore } from '../ports/ProgressStore';
import { merge, type LegacyProgress } from './WebProgressStore';

/** Native key-value storage (iOS / Android) through Capacitor. */
export class NativeProgressStore implements ProgressStore {
  constructor(private readonly key = 'le-casse/progress') {}

  async load(): Promise<Progress> {
    const { value } = await Preferences.get({ key: this.key });
    return value ? merge(JSON.parse(value) as LegacyProgress) : NO_PROGRESS;
  }

  async save(progress: Progress): Promise<void> {
    await Preferences.set({ key: this.key, value: JSON.stringify(progress) });
  }
}
