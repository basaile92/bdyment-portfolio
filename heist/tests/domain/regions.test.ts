import { describe, expect, it } from 'vitest';
import { closedRegions, DEFAULT_BOARD, type Surface } from '../../src/domain';

const plan = (entries: [string, Surface][]) => new Map(entries);

describe('closed shapes', () => {
  it('fills a square drawn with four walls', () => {
    const square = plan([['h:2,2', { color: 'red' }], ['h:2,3', { color: 'red' }], ['v:2,2', { color: 'red' }], ['v:3,2', { color: 'red' }]]);
    const regions = closedRegions(DEFAULT_BOARD, square);
    expect(regions).toHaveLength(1);
    expect(regions[0]?.color).toBe('red');
    expect(regions[0]?.quarters).toHaveLength(4);
  });

  it('fills a diamond drawn only with facets', () => {
    const diamond = plan([
      ['d:2,2', { color: 'blue', orientation: '/' }], ['d:3,2', { color: 'blue', orientation: '\\' }],
      ['d:2,3', { color: 'blue', orientation: '\\' }], ['d:3,3', { color: 'blue', orientation: '/' }],
    ]);
    const regions = closedRegions(DEFAULT_BOARD, diamond);
    expect(regions).toHaveLength(1);
    expect(regions[0]?.quarters).toHaveLength(8);
  });

  it('closes a shape against the board edge', () => {
    const corner = plan([['h:0,0', { color: 'yellow' }], ['v:0,0', { color: 'yellow' }], ['h:0,1', { color: 'yellow' }], ['v:1,0', { color: 'yellow' }]]);
    expect(closedRegions(DEFAULT_BOARD, corner)).toHaveLength(1);
  });

  it('does not fill an open shape', () => {
    const open = plan([['h:2,2', { color: 'red' }], ['v:2,2', { color: 'red' }], ['v:3,2', { color: 'red' }]]);
    expect(closedRegions(DEFAULT_BOARD, open)).toHaveLength(0);
  });
});
