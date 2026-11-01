export type SoundCue = 'laser' | 'draw' | 'erase' | 'alarm' | 'success' | 'caught' | 'tick';

/** Sound effects, muted or not. */
export interface Sound {
  play(cue: SoundCue): void;
  setEnabled(enabled: boolean): void;
}
