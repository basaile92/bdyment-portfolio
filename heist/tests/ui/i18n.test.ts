import { describe, expect, it } from 'vitest';
import { maskOf } from '../../src/domain';
import { en } from '../../src/ui/i18n/en';
import { fr } from '../../src/ui/i18n/fr';
import { detectLanguage } from '../../src/ui/i18n/strings';
import { laserDescription } from '../../src/ui/presenters/palette';
import { speak } from '../../src/ui/presenters/messages';

describe('languages', () => {
  it('names all 16 laser colours in both languages', () => {
    expect(fr.laserNames).toHaveLength(16);
    expect(en.laserNames).toHaveLength(16);
  });

  it('describes a mix in English', () => expect(laserDescription(maskOf('red', 'blue'), en)).toBe('purple (red + blue)'));

  it('handles plurals per language', () => {
    expect(en.speech.alarm(1)).toContain('1 sensor doesn');
    expect(fr.speech.alarm(3)).toContain('3 capteurs ne collent');
  });

  it('turns **stars** into bold parts', () => {
    expect(speak({ kind: 'intro' }, en).filter((p) => p.strong).map((p) => p.text)).toEqual(['emitter']);
  });

  it('picks French for French browsers, English otherwise', () => {
    expect(detectLanguage('fr-FR')).toBe('fr');
    expect(detectLanguage('de-DE')).toBe('en');
    expect(detectLanguage(undefined)).toBe('en');
  });
});
