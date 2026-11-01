import { PRISMJACK_JEWELS, SHAPES, type JewelSpec } from '../domain';

export type PrismjackMode =
  | { readonly kind: 'training'; readonly level: 1 | 2 | 3 }
  | { readonly kind: 'daily'; readonly day: string }
  | { readonly kind: 'free' };

const TRAINING: Record<1 | 2 | 3, readonly JewelSpec[]> = {
  1: [{ shape: SHAPES.diamond, color: 'yellow' }],
  2: [{ shape: SHAPES.diamond, color: 'yellow' }, { shape: SHAPES.legTriangle, color: 'red' }],
  3: [{ shape: SHAPES.smallTriangle, color: 'blue' }, { shape: SHAPES.legTriangle, color: 'red' }, { shape: SHAPES.trapezoid, color: 'white' }],
};

export function jewelsFor(mode: PrismjackMode): readonly JewelSpec[] {
  return mode.kind === 'training' ? TRAINING[mode.level] : PRISMJACK_JEWELS;
}

/** Local calendar day, "YYYY-MM-DD". */
export function dayOf(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Time left before the next daily prismjack (local midnight), in whole hours and minutes. */
export function untilNextDay(date: Date): { readonly hours: number; readonly minutes: number } {
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  const minutes = Math.max(0, Math.ceil((midnight.getTime() - date.getTime()) / 60000));
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}

/** Same seed for everybody on the same day: everyone plays the same daily prismjack. */
export function dailySeed(day: string): number {
  let h = 2166136261;
  for (const ch of `le-casse/${day}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function previousDay(day: string): string {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return dayOf(d);
}
