import { describe, expect, it } from 'vitest';
import { colorsIn, isMixed, maskOf, tint, TRANSPARENT } from '../../src/domain';

describe('laser colours', () => {
  it('starts transparent', () => expect(colorsIn(TRANSPARENT)).toEqual([]));

  it('counts a colour only once', () => {
    expect(tint(tint(TRANSPARENT, 'red'), 'red')).toBe(maskOf('red'));
  });

  it('mixes colours as a set', () => {
    const violet = maskOf('blue', 'red');
    expect(colorsIn(violet)).toEqual(['red', 'blue']);
    expect(isMixed(violet)).toBe(true);
    expect(isMixed(maskOf('yellow'))).toBe(false);
  });
});
