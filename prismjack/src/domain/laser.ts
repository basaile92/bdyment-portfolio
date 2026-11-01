import { isInside, portEntry, portOutside, type BoardSize, type PortId, type Position } from './board';
import { tint, TRANSPARENT, type ColorMask } from './colors';
import { edgeCrossed, facetKey, type Surface, type SurfaceKey, type SurfaceMap } from './surfaces';

export interface LaserResult {
  /** Port where the laser comes out (may be the entry port itself). */
  readonly exit: PortId;
  /** Set of jewel colours touched. */
  readonly color: ColorMask;
  /** Surfaces touched, in order. */
  readonly touched: readonly SurfaceKey[];
  /** Impact points in board units (cell (x,y) spans [x,x+1]×[y,y+1]). */
  readonly impacts: readonly Position[];
}

interface Beam {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: ColorMask;
}

/** Reflection on a facet: '/' maps (dx,dy) → (-dy,-dx), '\' maps (dx,dy) → (dy,dx). */
function deflect(beam: Beam, facet: Surface): void {
  const { dx, dy } = beam;
  if (facet.orientation === '/') { beam.dx = -dy; beam.dy = -dx; } else { beam.dx = dy; beam.dy = dx; }
}

/**
 * Follows a laser fired from `port` through the given surfaces.
 * Straight surfaces send the beam back, facets turn it by 90°, every surface
 * touched tints it. Paths are reversible, so a laser always comes out.
 */
export function traceLaser(board: BoardSize, surfaces: SurfaceMap, port: PortId): LaserResult {
  const start = portEntry(board, port);
  const beam: Beam = { x: start.x - start.dx, y: start.y - start.dy, dx: start.dx, dy: start.dy, color: TRANSPARENT };
  const touched: SurfaceKey[] = [];
  const impacts: Position[] = [];

  const hitFacetHere = (): void => {
    const key = facetKey(beam.x, beam.y);
    const facet = surfaces.get(key);
    if (!facet) return;
    touched.push(key);
    impacts.push({ x: beam.x + 0.5, y: beam.y + 0.5 });
    beam.color = tint(beam.color, facet.color);
    deflect(beam, facet);
  };

  const maxSteps = 16 * board.width * board.height + 16;
  for (let step = 0; step < maxSteps; step++) {
    const edgeKey = edgeCrossed(beam.x, beam.y, beam.dx, beam.dy);
    const edge = surfaces.get(edgeKey);
    if (edge) {
      touched.push(edgeKey);
      impacts.push({ x: beam.x + 0.5 + beam.dx / 2, y: beam.y + 0.5 + beam.dy / 2 });
      beam.color = tint(beam.color, edge.color);
      beam.dx = -beam.dx;
      beam.dy = -beam.dy;
      if (!isInside(board, beam.x, beam.y)) break;
      hitFacetHere(); // coming back to the centre of a cell holding a facet
      continue;
    }
    beam.x += beam.dx;
    beam.y += beam.dy;
    if (!isInside(board, beam.x, beam.y)) break;
    hitFacetHere();
  }
  return { exit: portOutside(board, beam.x, beam.y), color: beam.color, touched, impacts };
}
