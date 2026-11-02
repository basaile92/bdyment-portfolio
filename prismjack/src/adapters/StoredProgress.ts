import { NO_PROGRESS, type Progress, type ProgressStore } from '../ports/ProgressStore';
import { decodeProgress, encodeProgress } from './progressCodec';

/** The raw text storage underneath (browser storage, native preferences). Any call may throw. */
export interface TextStorage {
  read(key: string): Promise<string | null>;
  write(key: string, text: string): Promise<void>;
}

/**
 * Progress kept in memory as the single source of truth, written to storage in order.
 *
 * - Reads come from memory after the first one, so two quick updates never read stale data.
 * - Writes are queued: an older save can never land after a newer one.
 * - Unreadable stored text is kept aside under `<key>/unreadable` (for support) and the game starts fresh;
 *   a failing storage never stops the game, progress simply lives in memory.
 */
export class StoredProgress implements ProgressStore {
  private cache: Progress | null = null;
  private writes: Promise<void> = Promise.resolve();

  constructor(private readonly storage: TextStorage, private readonly key = 'le-casse/progress') {}

  async load(): Promise<Progress> {
    if (this.cache) return this.cache;
    const text = await this.storage.read(this.key).catch(() => null);
    const decoded = decodeProgress(text);
    if (decoded === null && text) await this.storage.write(`${this.key}/unreadable`, text).catch(() => undefined);
    // Another load may have finished while this one awaited storage: keep the first.
    this.cache ??= decoded ?? NO_PROGRESS;
    return this.cache;
  }

  save(progress: Progress): Promise<void> {
    this.cache = progress;
    const text = encodeProgress(progress);
    this.writes = this.writes.then(() => this.storage.write(this.key, text)).catch(() => undefined);
    return this.writes;
  }
}
