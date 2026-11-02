import type { Sound, SoundCue } from '../ports/Sound';

interface Note {
  readonly freq: number;
  readonly to?: number;
  readonly at: number;
  readonly dur: number;
  readonly type: OscillatorType;
  readonly gain: number;
}

/** Tiny synthesised sound effects: no audio files to download. */
const CUES: Record<SoundCue, readonly Note[]> = {
  laser: [{ freq: 1400, to: 300, at: 0, dur: 0.18, type: 'sawtooth', gain: 0.05 }],
  draw: [{ freq: 660, at: 0, dur: 0.05, type: 'triangle', gain: 0.06 }],
  erase: [{ freq: 420, to: 260, at: 0, dur: 0.07, type: 'triangle', gain: 0.05 }],
  tick: [{ freq: 900, at: 0, dur: 0.03, type: 'square', gain: 0.02 }],
  // Warnings stay soft in headphones: rounded waves, lower pitch, quieter.
  alarm: [0, 0.24, 0.48].map((at) => ({ freq: 740, to: 560, at, dur: 0.18, type: 'triangle' as const, gain: 0.06 })),
  caught: [0, 0.32, 0.64].map((at, i) => ({ freq: 560 - i * 60, to: 420 - i * 50, at, dur: 0.28, type: 'triangle' as const, gain: 0.06 })),
  success: [523, 659, 784, 1047].map((freq, i) => ({ freq, at: i * 0.09, dur: 0.16, type: 'triangle' as const, gain: 0.07 })),
};

export class WebAudioSound implements Sound {
  private context: AudioContext | null = null;

  constructor(private enabled = true) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  play(cue: SoundCue): void {
    if (!this.enabled) return;
    const ctx = this.audio();
    if (!ctx) return;
    for (const note of CUES[cue]) this.note(ctx, note);
  }

  private audio(): AudioContext | null {
    try {
      // iOS: mix with the player's music and stay silent when the ring/silent switch is on.
      const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
      if (session && session.type !== 'ambient') session.type = 'ambient';
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume();
      return this.context;
    } catch {
      return null; // audio not available
    }
  }

  private note(ctx: AudioContext, n: Note): void {
    const start = ctx.currentTime + n.at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = n.type;
    osc.frequency.setValueAtTime(n.freq, start);
    if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, start + n.dur);
    gain.gain.setValueAtTime(n.gain, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + n.dur + 0.02);
  }
}
