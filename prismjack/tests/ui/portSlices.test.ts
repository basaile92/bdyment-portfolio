import { describe, expect, it } from 'vitest';
import { maskOf } from '../../src/domain';
import { colorSlices } from '../../src/ui/presenters/portSlices';

describe('colorSlices', () => {
  const c = { x: 0, y: 0 };

  it('does not split a pure colour', () => {
    expect(colorSlices(maskOf('red'), c, 1)).toEqual([]);
    expect(colorSlices(0, c, 1)).toEqual([]);
  });

  it('splits violet into a blue half and a red half', () => {
    const slices = colorSlices(maskOf('red', 'blue'), c, 1);
    expect(slices.map((s) => s.color).sort()).toEqual(['blue', 'red']);
    expect(slices[0]?.spot.x).toBeLessThan(0);
    expect(slices[1]?.spot.x).toBeGreaterThan(0);
  });

  it('gives one slice per colour in a four-colour mix', () => {
    expect(colorSlices(maskOf('red', 'blue', 'yellow', 'white'), c, 1)).toHaveLength(4);
  });
});
