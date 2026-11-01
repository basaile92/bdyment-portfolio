import { describe, expect, it } from 'vitest';
import { squirclePath } from '../../src/ui/presenters/squircle';

const numbers = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe('iOS continuous corners', () => {
  it('stays inside the box and touches all four sides', () => {
    const n = numbers(squirclePath(200, 76, 38));
    const xs = n.filter((_, i) => i % 2 === 0), ys = n.filter((_, i) => i % 2 === 1);
    expect(Math.min(...xs)).toBe(0);
    expect(Math.max(...xs)).toBe(200);
    expect(Math.min(...ys)).toBe(0);
    expect(Math.max(...ys)).toBe(76);
  });

  it('starts the curve 1.53 radius away from the corner (an app icon: radius 22.37 % of its size)', () => {
    expect(squirclePath(100, 100, 22.37).startsWith('M 34.2 0')).toBe(true);
  });

  it('becomes a continuous capsule when the radius is too big for the height', () => {
    // Both corners of a short side meet in the middle: the curve starts half the height from the corner.
    expect(squirclePath(300, 76, 999).startsWith('M 38 0')).toBe(true);
  });
});
