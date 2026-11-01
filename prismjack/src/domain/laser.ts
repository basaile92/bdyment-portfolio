import { isInside, portEntry, portOutside, type BoardSize, type PortId, type Position } from './board';
import { tint, TRANSPARENT, type ColorMask, type JewelColor } from './colors';
import { NO_PILLARS, prismColor, type PillarScene } from './pillars';
import { edgeCrossed, facetKey, type FacetOrientation, type SurfaceKey, type SurfaceMap } from './surfaces';

/** A laser swallowed by a black pillar comes out nowhere. */
export const ABSORBED: PortId = -1;

export interface LaserResult {
  /** Port where the laser comes out (may be the entry port itself), or ABSORBED. */
  readonly exit: PortId;
  /** Set of colours the light picked up (meaningless once absorbed: nothing comes out). */
  readonly color: ColorMask;
  /** Surfaces touched, in order. */
  readonly touched: readonly SurfaceKey[];
  /** Impact points in board units (cell (x,y) spans [x,x+1]×[y,y+1]). */
  readonly impacts: readonly Position[];
  /** Pillars touched (indices), in order: prisms move on after the test. */
  readonly pillarsTouched: readonly number[];
}

interface Beam {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: ColorMask;
}

/** Reflection on a facet: '/' maps (dx,dy) → (-dy,-dx), '\' maps (dx,dy) → (dy,dx). */
function deflect(beam: Beam, orientation: FacetOrientation | undefined): void {
  const { dx, dy } = beam;
  if (orientation === '/') { beam.dx = -dy; beam.dy = -dx; } else { beam.dx = dy; beam.dy = dx; }
}

type Hit = { readonly kind: 'tint'; readonly color: JewelColor | null; readonly orientation?: FacetOrientation; readonly pillar?: number } | { readonly kind: 'absorb'; readonly pillar: number };

/** One laser on its way through a room: the beam, and everything it touched so far. */
class LightRun {
  readonly touched: SurfaceKey[] = [];
  readonly impacts: Position[] = [];
  readonly pillarsTouched: number[] = [];
  absorbed = false;

  constructor(
    private readonly surfaces: SurfaceMap,
    private readonly scene: PillarScene,
    readonly beam: Beam,
  ) {}

  hitAt(key: SurfaceKey): Hit | null {
    const jewel = this.surfaces.get(key);
    if (jewel) return { kind: 'tint', color: jewel.color, ...(jewel.orientation ? { orientation: jewel.orientation } : {}) };
    const own = this.scene.surfaces.get(key);
    if (!own) return null;
    const pillar = this.scene.pillars[own.owner];
    if (!pillar || pillar.kind === 'black') return { kind: 'absorb', pillar: own.owner };
    const color = pillar.kind === 'prism' ? prismColor(pillar, this.scene.states[own.owner] ?? 0) : null;
    return { kind: 'tint', color, pillar: own.owner, ...(own.orientation ? { orientation: own.orientation } : {}) };
  }

  /** Records a hit and tints the beam; false when the light is swallowed. */
  take(key: SurfaceKey, hit: Hit, at: Position): boolean {
    this.touched.push(key);
    this.impacts.push(at);
    if (hit.pillar !== undefined) this.pillarsTouched.push(hit.pillar);
    if (hit.kind === 'absorb') {
      this.absorbed = true;
      return false;
    }
    if (hit.color) this.beam.color = tint(this.beam.color, hit.color);
    return true;
  }

  /** The facet in the beam's cell, if any, turns it; false when the light is swallowed. */
  facetHere(): boolean {
    const { beam } = this;
    const key = facetKey(beam.x, beam.y);
    const hit = this.hitAt(key);
    if (!hit) return true;
    if (!this.take(key, hit, { x: beam.x + 0.5, y: beam.y + 0.5 })) return false;
    if (hit.kind === 'tint') deflect(beam, hit.orientation);
    return true;
  }

  /** One step: bounce on the edge ahead, or move to the next cell. False when the light is gone. */
  step(board: BoardSize): boolean {
    const { beam } = this;
    const edgeKey = edgeCrossed(beam.x, beam.y, beam.dx, beam.dy);
    const edge = this.hitAt(edgeKey);
    if (edge) {
      if (!this.take(edgeKey, edge, { x: beam.x + 0.5 + beam.dx / 2, y: beam.y + 0.5 + beam.dy / 2 })) return false;
      beam.dx = -beam.dx;
      beam.dy = -beam.dy;
      // Coming back to the centre of a cell holding a facet.
      return isInside(board, beam.x, beam.y) && this.facetHere();
    }
    beam.x += beam.dx;
    beam.y += beam.dy;
    return isInside(board, beam.x, beam.y) && this.facetHere();
  }
}

/**
 * Follows a laser fired from `port` through the jewels' surfaces and the room's pillars.
 * Straight surfaces send the beam back, facets turn it by 90°, jewels tint it; a clear pillar
 * sends it on untinted, a prism gives its current colour, a black pillar swallows it.
 */
export function traceLaser(board: BoardSize, surfaces: SurfaceMap, port: PortId, scene: PillarScene = NO_PILLARS): LaserResult {
  const start = portEntry(board, port);
  const run = new LightRun(surfaces, scene, { x: start.x - start.dx, y: start.y - start.dy, dx: start.dx, dy: start.dy, color: TRANSPARENT });
  const maxSteps = 16 * board.width * board.height + 16;
  for (let step = 0; step < maxSteps && run.step(board); step++);
  const { beam } = run;
  return {
    exit: run.absorbed ? ABSORBED : portOutside(board, beam.x, beam.y),
    color: beam.color, touched: run.touched, impacts: run.impacts, pillarsTouched: run.pillarsTouched,
  };
}

/** Same result as seen from outside: same exit, and same colour unless nothing came out. */
export function sameResult(a: { exit: PortId; color: ColorMask }, b: { exit: PortId; color: ColorMask }): boolean {
  return a.exit === b.exit && (a.exit === ABSORBED || a.color === b.color);
}
