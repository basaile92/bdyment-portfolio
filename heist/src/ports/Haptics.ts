/** Physical feedback on devices that support it. */
export interface Haptics {
  tap(): void;
  success(): void;
  failure(): void;
}
