import type { RandomSource } from '../ports/RandomSource';

/** mulberry32: small, fast, good enough for puzzle generation. */
export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  static fromClock(): SeededRandom {
    return new SeededRandom(Date.now() ^ Math.floor(Math.random() * 2 ** 31));
  }
}
