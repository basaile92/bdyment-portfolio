import type { Strings } from '../i18n/strings';

/** Moments of a training room where the thief explains a rule, once. */
export type TipEvent = 'start' | 'first-shot' | 'colored' | 'transparent' | 'back' | 'first-draw' | 'jewel-drawn' | 'all-drawn';

const KEYS: Record<Exclude<TipEvent, 'start'>, keyof Strings['tips']> = {
  'first-shot': 'firstShot',
  colored: 'colored',
  transparent: 'transparent',
  back: 'back',
  'first-draw': 'firstDraw',
  'jewel-drawn': 'jewelDrawn',
  'all-drawn': 'allDrawn',
};

export function tipText(event: TipEvent, level: 1 | 2 | 3, s: Strings): string {
  return event === 'start' ? s.trainingStart[level] : s.tips[KEYS[event]];
}
