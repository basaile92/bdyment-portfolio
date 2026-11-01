import {
  facetKey, isInside, parseKey, portFor, portSide, sideKey,
  type BoardSize, type CellSide, type JewelColor, type PortId, type Surface, type SurfaceKey,
} from '../../domain';

/** Thickness of the emitter band around the room, in cells (wide enough for a thumb). */
export const BAND = 0.85;

/** Below this distance from a side (in cells), a touch draws a wall; further in, a facet. */
const WALL_ZONE = 0.27;

export type Tool = 'trace' | 'empty';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface CellHit {
  readonly kind: 'cell';
  readonly x: number;
  readonly y: number;
  readonly u: number;
  readonly v: number;
}

export type Hit = CellHit | { readonly kind: 'port'; readonly port: PortId };

export function viewSize(board: BoardSize): { width: number; height: number } {
  return { width: board.width + 2 * BAND, height: board.height + 2 * BAND };
}

/** Centre of a port, in view units. */
export function portCenter(board: BoardSize, port: PortId): Point {
  const { side, index } = portSide(board, port);
  const mid = BAND / 2;
  switch (side) {
    case 'top': return { x: BAND + index + 0.5, y: mid };
    case 'bottom': return { x: BAND + index + 0.5, y: BAND + board.height + mid };
    case 'left': return { x: mid, y: BAND + index + 0.5 };
    case 'right': return { x: BAND + board.width + mid, y: BAND + index + 0.5 };
  }
}

/** Where a laser enters the room from a port (on the room's edge), in view units. */
export function portMouth(board: BoardSize, port: PortId): Point {
  const c = portCenter(board, port);
  const { side } = portSide(board, port);
  const half = BAND / 2;
  if (side === 'top') return { x: c.x, y: c.y + half };
  if (side === 'bottom') return { x: c.x, y: c.y - half };
  if (side === 'left') return { x: c.x + half, y: c.y };
  return { x: c.x - half, y: c.y };
}

/** Board coordinates (cells) → view units. */
export function toView(p: Point): Point {
  return { x: p.x + BAND, y: p.y + BAND };
}

function horizontalBandPort(board: BoardSize, p: Point): PortId | null {
  const column = Math.floor(p.x - BAND);
  if (column < 0 || column >= board.width) return null;
  if (p.y < BAND) return portFor(board, 'top', column);
  return p.y > BAND + board.height ? portFor(board, 'bottom', column) : null;
}

function verticalBandPort(board: BoardSize, p: Point): PortId | null {
  const row = Math.floor(p.y - BAND);
  if (row < 0 || row >= board.height) return null;
  if (p.x < BAND) return portFor(board, 'left', row);
  return p.x > BAND + board.width ? portFor(board, 'right', row) : null;
}

export function hitTest(board: BoardSize, p: Point): Hit | null {
  const bx = p.x - BAND;
  const by = p.y - BAND;
  const x = Math.floor(bx);
  const y = Math.floor(by);
  if (isInside(board, x, y)) return { kind: 'cell', x, y, u: bx - x, v: by - y };
  const port = horizontalBandPort(board, p) ?? verticalBandPort(board, p);
  return port === null ? null : { kind: 'port', port };
}

export interface DrawTarget {
  readonly key: SurfaceKey;
  readonly surface: Surface;
}

export function wallTarget(x: number, y: number, side: CellSide, color: JewelColor): DrawTarget {
  return { key: sideKey(x, y, side), surface: { color } };
}

export function facetTarget(x: number, y: number, orientation: '/' | '\\', color: JewelColor): DrawTarget {
  return { key: facetKey(x, y), surface: { color, orientation } };
}

/**
 * One gesture for both surfaces: near a side of the cell draws that wall,
 * further in draws the diagonal closest to the finger.
 */
export function traceTarget(hit: CellHit, color: JewelColor): DrawTarget {
  const distances: [CellSide, number][] = [['L', hit.u], ['R', 1 - hit.u], ['T', hit.v], ['B', 1 - hit.v]];
  const [side, distance] = distances.reduce((a, b) => (b[1] < a[1] ? b : a));
  if (distance < WALL_ZONE) return wallTarget(hit.x, hit.y, side, color);
  return facetTarget(hit.x, hit.y, (hit.u - 0.5) * (hit.v - 0.5) > 0 ? '\\' : '/', color);
}

/** Segment of a surface, in view units. */
export function surfaceSegment(key: SurfaceKey, surface: Surface): [Point, Point] {
  const { kind, x, y } = parseKey(key);
  const a = toView({ x, y });
  if (kind === 'h') return [a, { x: a.x + 1, y: a.y }];
  if (kind === 'v') return [a, { x: a.x, y: a.y + 1 }];
  return surface.orientation === '/' ? [{ x: a.x, y: a.y + 1 }, { x: a.x + 1, y: a.y }] : [a, { x: a.x + 1, y: a.y + 1 }];
}
