/** Physical feedback on devices that support it. */
export interface Haptics {
  tap(): void;
  /** Very light tick: the target under the finger changed. */
  tick(): void;
  success(): void;
  failure(): void;
  /** The player's setting: vibrations on or off. */
  setEnabled(enabled: boolean): void;
}
