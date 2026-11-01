import type { Shot } from '../../application';
import type { Strings } from '../i18n/strings';
import { ABSORBED } from '../../domain';
import { laserDescription, laserFill } from './palette';

/** What the thief says in his bubble. Pure data: the view decides how to style it. */
export type Speech =
  | { readonly kind: 'intro' }
  | { readonly kind: 'tip'; readonly text: string }
  | { readonly kind: 'shot'; readonly number: number; readonly shot: Shot; readonly tip?: string }
  | { readonly kind: 'cleared' }
  | { readonly kind: 'empty-plan' }
  | { readonly kind: 'alarm'; readonly level: number }
  | { readonly kind: 'caught' }
  | { readonly kind: 'success' };

export interface SpeechPart {
  readonly text: string;
  readonly strong?: boolean;
  readonly tone?: 'good' | 'bad';
  readonly swatch?: string;
}

/** "**bold** rest" → parts, bold where the stars are. */
function rich(text: string, tone?: 'good' | 'bad'): SpeechPart[] {
  return text
    .split('**')
    .map((t, i) => ({ text: t, ...(i % 2 === 1 ? { strong: true } : {}), ...(tone ? { tone } : {}) }))
    .filter((p) => p.text !== '');
}

export function speak(speech: Speech, s: Strings): SpeechPart[] {
  const say = s.speech;
  switch (speech.kind) {
    case 'intro':
      return rich(say.intro);
    case 'tip':
      return [{ text: speech.text }];
    case 'shot': {
      const parts = describeShot(speech.number, speech.shot, s);
      return speech.tip ? [...parts, { text: `${s.sentenceGap}${speech.tip}`, tone: 'good' }] : parts;
    }
    case 'cleared':
      return [{ text: say.cleared }];
    case 'empty-plan':
      return [{ text: say.emptyPlan, tone: 'bad' }];
    case 'alarm':
      return [{ text: say.alarm, tone: 'bad' }, { text: s.sentenceGap }, { text: say.alarmUp(speech.level), strong: true }];
    case 'caught':
      return [{ text: say.caught, tone: 'bad' }];
    case 'success':
      return [{ text: say.successLead, tone: 'good' }, { text: say.successRest }];
  }
}

function describeShot(number: number, shot: Shot, s: Strings): SpeechPart[] {
  if (shot.exit === ABSORBED) return [{ text: s.speech.absorbed(number) }];
  const color = shot.color === 0 ? {} : { swatch: laserFill(shot.color) };
  return [
    { text: s.speech.shot(number, shot.exit === shot.entry) },
    { text: laserDescription(shot.color, s), strong: true, ...color },
    { text: s.fullStop },
  ];
}
