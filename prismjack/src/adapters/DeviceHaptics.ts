import { Haptics as CapHaptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import type { Haptics } from '../ports/Haptics';

/** Native haptics on iOS / Android, vibration API (or nothing) on the web. */
export class DeviceHaptics implements Haptics {
  private enabled = true;

  constructor(private readonly native: boolean) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  tap(): void {
    if (!this.enabled) return;
    if (this.native) void CapHaptics.impact({ style: ImpactStyle.Light });
    else this.vibrate(10);
  }

  tick(): void {
    if (!this.enabled) return;
    if (this.native) void CapHaptics.selectionChanged();
    else this.vibrate(5);
  }

  success(): void {
    if (!this.enabled) return;
    if (this.native) void CapHaptics.notification({ type: NotificationType.Success });
    else this.vibrate([20, 40, 20]);
  }

  failure(): void {
    if (!this.enabled) return;
    if (this.native) void CapHaptics.notification({ type: NotificationType.Error });
    else this.vibrate([60, 40, 60]);
  }

  private vibrate(pattern: number | number[]): void {
    try {
      globalThis.navigator?.vibrate?.(pattern);
    } catch {
      /* not supported */
    }
  }
}
