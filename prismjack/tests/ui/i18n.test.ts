import { describe, expect, it } from 'vitest';
import { maskOf } from '../../src/domain';
import { en } from '../../src/ui/i18n/en';
import { fr } from '../../src/ui/i18n/fr';
import { detectLanguage, LANGUAGES, stringsFor } from '../../src/ui/i18n/strings';
import { laserDescription } from '../../src/ui/presenters/palette';
import { speak } from '../../src/ui/presenters/messages';

describe('languages', () => {
  it('names all 16 laser colours in both languages', () => {
    expect(fr.laserNames).toHaveLength(16);
    expect(en.laserNames).toHaveLength(16);
  });

  it('describes a mix in English', () => expect(laserDescription(maskOf('red', 'blue'), en)).toBe('red + blue'));

  it('handles plurals per language', () => {
    expect(en.tests(1)).toContain('test');
    expect(fr.runOver(1, 2)).toContain('2');
  });

  it('turns **stars** into bold parts', () => {
    expect(speak({ kind: 'intro' }, en).filter((p) => p.strong).map((p) => p.text)).toEqual(['torch']);
  });

  it('picks the browser language when the game speaks it, English otherwise', () => {
    expect(detectLanguage('fr-FR')).toBe('fr');
    expect(detectLanguage('de-DE')).toBe('de');
    expect(detectLanguage('pt-BR')).toBe('pt');
    expect(detectLanguage('zh-TW')).toBe('zh');
    expect(detectLanguage('nl-NL')).toBe('en');
    expect(detectLanguage(undefined)).toBe('en');
  });

  it('has a complete tutorial and 10 level intros in every language', () => {
    const ids = stringsFor('en').tutorialPages.map((p) => p.id);
    for (const { id } of LANGUAGES) {
      const s = stringsFor(id);
      expect(s.tutorialPages.map((p) => p.id)).toEqual(ids);
      expect(s.levelIntro).toHaveLength(10);
      expect(s.laserNames).toHaveLength(16);
    }
  });
});
