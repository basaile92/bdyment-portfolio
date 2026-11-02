import { describe, expect, it } from 'vitest';
import { merge } from '../../src/adapters/WebProgressStore';

describe('progress saved before the Prismjack rename', () => {
  it('keeps the won and perfect counts', () => {
    const progress = merge({ heistsWon: 7, perfectHeists: 3 });
    expect(progress.prismjacksWon).toBe(7);
    expect(progress.perfectPrismjacks).toBe(3);
    expect('heistsWon' in progress).toBe(false);
  });

  it('prefers the new names when both exist', () => {
    expect(merge({ heistsWon: 1, prismjacksWon: 9 }).prismjacksWon).toBe(9);
  });
});
