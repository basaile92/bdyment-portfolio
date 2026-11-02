import type { TextStorage } from './StoredProgress';

/** Browser storage. It can be missing or throw (private mode, sandbox, quota): the callers fail soft. */
export const webStorage: TextStorage = {
  async read(key) {
    return globalThis.localStorage?.getItem(key) ?? null;
  },
  async write(key, text) {
    globalThis.localStorage?.setItem(key, text);
  },
};
