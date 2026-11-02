import { Preferences } from '@capacitor/preferences';
import type { TextStorage } from './StoredProgress';

/** Native key-value storage (iOS / Android) through Capacitor. */
export const nativeStorage: TextStorage = {
  async read(key) {
    return (await Preferences.get({ key })).value;
  },
  async write(key, text) {
    await Preferences.set({ key, value: text });
  },
};
