/** Source of randomness, injected so the game can be seeded (daily puzzle, tests). */
export interface RandomSource {
  /** A float in [0, 1). */
  next(): number;
}
