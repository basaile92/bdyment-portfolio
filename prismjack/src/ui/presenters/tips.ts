import type { Strings } from '../i18n/strings';

/** Moments of the first levels where the thief explains a rule, once. */
export type TipEvent = 'first-shot' | 'colored' | 'transparent' | 'back' | 'first-draw' | 'jewel-drawn' | 'all-drawn';

const KEYS: Record<TipEvent, keyof Strings['tips']> = {
  'first-shot': 'firstShot',
  colored: 'colored',
  transparent: 'transparent',
  back: 'back',
  'first-draw': 'firstDraw',
  'jewel-drawn': 'jewelDrawn',
  'all-drawn': 'allDrawn',
};

export function tipText(event: TipEvent, s: Strings): string {
  return s.tips[KEYS[event]];
}
