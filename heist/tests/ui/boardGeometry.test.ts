import { describe, expect, it } from 'vitest';
import { DEFAULT_BOARD, maskOf, portFor } from '../../src/domain';
import { BAND, hitTest, portCenter, traceTarget } from '../../src/ui/presenters/boardGeometry';
import { moveCursor } from '../../src/ui/presenters/keyboard';
import { laserDescription } from '../../src/ui/presenters/palette';
import { fr } from '../../src/ui/i18n/fr';

const board = DEFAULT_BOARD;

describe('board gestures', () => {
  it('finds the touched cell and where in it', () => {
    const hit = hitTest(board, { x: BAND + 2.25, y: BAND + 3.75 });
    expect(hit).toMatchObject({ kind: 'cell', x: 2, y: 3 });
    if (hit?.kind === 'cell') { expect(hit.u).toBeCloseTo(0.25); expect(hit.v).toBeCloseTo(0.75); }
  });

  it('finds the touched emitter in the band around the room', () => {
    for (const port of [0, 9, 20, 35]) expect(hitTest(board, portCenter(board, port))).toEqual({ kind: 'port', port });
  });

  it('ignores the corners', () => expect(hitTest(board, { x: 0.1, y: 0.1 })).toBeNull());

  it('draws a wall near a side and a facet towards the centre', () => {
    expect(traceTarget({ kind: 'cell', x: 2, y: 3, u: 0.5, v: 0.05 }, 'red').key).toBe('h:2,3');
    expect(traceTarget({ kind: 'cell', x: 2, y: 3, u: 0.95, v: 0.5 }, 'red').key).toBe('v:3,3');
    expect(traceTarget({ kind: 'cell', x: 1, y: 1, u: 0.35, v: 0.35 }, 'blue').surface.orientation).toBe('\\');
    expect(traceTarget({ kind: 'cell', x: 1, y: 1, u: 0.65, v: 0.35 }, 'blue').surface.orientation).toBe('/');
  });

  it('places the top-left emitter above the first column', () => {
    expect(portCenter(board, portFor(board, 'top', 0))).toEqual({ x: BAND + 0.5, y: BAND / 2 });
  });
});

describe('keyboard cursor', () => {
  it('leaves the room onto an emitter and comes back', () => {
    const out = moveCursor(board, { kind: 'cell', x: 3, y: 0 }, 'ArrowUp');
    expect(out).toEqual({ kind: 'port', port: portFor(board, 'top', 3) });
    expect(moveCursor(board, out, 'ArrowDown')).toEqual({ kind: 'cell', x: 3, y: 0 });
    expect(moveCursor(board, out, 'ArrowRight')).toEqual({ kind: 'port', port: portFor(board, 'top', 4) });
  });
});

describe('colour names', () => {
  it('spells out mixes', () => expect(laserDescription(maskOf('red', 'blue'), fr)).toBe('violet (rouge + bleu)'));
  it('keeps simple colours short', () => expect(laserDescription(maskOf('yellow'), fr)).toBe('jaune'));
});
