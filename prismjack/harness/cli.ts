/**
 * Text harness to play Prismjack without the UI (used to check that the tutorial is enough).
 * State lives in a JSON file (HEIST_STATE, default ./heist-state.json). Commands:
 *   new <level 1-30> [variant 0-3]   start a level
 *   room                              show the room, the loot and the tests so far
 *   fire <torch>                      switch on a torch (T1.., R1.., B1.., L1..)
 *   shapes                            every orientation of every loot jewel
 *   place <jewel#> <orientation#> <col> <row>   put a jewel on the plan (top-left of its box)
 *   remove <jewel#>                   take a jewel off the plan
 *   go                                start the heist (submit the plan)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import {
  ABSORBED, colorsIn, jewelSurfaces, LEVEL_ROOMS, mirror, portFor, portSide, rotate, shapeSize,
  isInside, type BoardSize, type CellPart, type PlacedJewel, type PortId, type ShapeCell, type Side,
} from '../src/domain';
import { fireLaser } from '../src/application/fireLaser';
import { startMode } from '../src/application/startPrismjack';
import { submitPlan } from '../src/application/submitPlan';
import { alarms, type PrismjackState } from '../src/application/PrismjackState';

interface Saved {
  level: number;
  variant: number;
  fired: PortId[];
  placed: Record<string, { orient: number; col: number; row: number }>;
  wrongPlans: number;
  outcome?: string;
}

const FILE = process.env.HEIST_STATE ?? 'heist-state.json';
const GLYPH: Record<CellPart, string> = { full: '█', NW: '◤', NE: '◥', SW: '◣', SE: '◢' };
const SIDE_LETTER: Record<Side, string> = { top: 'T', right: 'R', bottom: 'B', left: 'L' };
const KIND = { black: 'k', clear: 'c', prism: 'p' } as const;

const load = (): Saved => JSON.parse(readFileSync(FILE, 'utf8')) as Saved;
const save = (s: Saved) => writeFileSync(FILE, JSON.stringify(s));

function torchName(board: BoardSize, port: PortId): string {
  const { side, index } = portSide(board, port);
  return `${SIDE_LETTER[side]}${index + 1}`;
}

function parseTorch(board: BoardSize, name: string): PortId | undefined {
  const m = /^([TRBL])(\d+)$/i.exec(name.trim());
  if (!m) return undefined;
  const side = (Object.entries(SIDE_LETTER).find(([, l]) => l === m[1]?.toUpperCase())?.[0]) as Side;
  const index = Number(m[2]) - 1;
  const max = side === 'top' || side === 'bottom' ? board.width : board.height;
  return index >= 0 && index < max ? portFor(board, side, index) : undefined;
}

function orientations(cells: readonly ShapeCell[]): ShapeCell[][] {
  const seen = new Set<string>();
  const out: ShapeCell[][] = [];
  for (const flip of [false, true]) {
    let current = flip ? mirror(cells) : [...cells];
    for (let r = 0; r < 4; r++) {
      const norm = normalise(current);
      const key = norm.map((c) => `${c.x},${c.y},${c.part}`).sort().join(' ');
      if (!seen.has(key)) { seen.add(key); out.push(norm); }
      current = rotate(current);
    }
  }
  return out;
}

function normalise(cells: readonly ShapeCell[]): ShapeCell[] {
  const minX = Math.min(...cells.map((c) => c.x));
  const minY = Math.min(...cells.map((c) => c.y));
  return cells.map((c) => ({ x: c.x - minX, y: c.y - minY, part: c.part }));
}

function drawCells(cells: readonly ShapeCell[]): string {
  const { width, height } = shapeSize(cells);
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    let line = '';
    for (let x = 0; x < width; x++) {
      const c = cells.find((q) => q.x === x && q.y === y);
      line += c ? GLYPH[c.part] : '·';
    }
    rows.push('      ' + line);
  }
  return rows.join('\n');
}

function build(saved: Saved): { state: PrismjackState; log: string[] } {
  let state = startMode({ kind: 'level', index: saved.level }, { next: () => (saved.variant + 0.5) / 4 });
  const log: string[] = [];
  for (const port of saved.fired) {
    const r = fireLaser(state, port);
    state = r.state;
    if (r.isNew) log.push(describeShot(state.puzzle.board, r.shot, state.shots.length));
  }
  return { state, log };
}

function colourWords(mask: number): string {
  const c = colorsIn(mask);
  return c.length ? c.join('+') : 'no colour';
}

function describeShot(board: BoardSize, shot: { entry: PortId; exit: PortId; color: number }, n: number): string {
  const from = torchName(board, shot.entry);
  if (shot.exit === ABSORBED) return `#${n} ${from}: light swallowed (absorbed), nothing comes out`;
  if (shot.exit === shot.entry) return `#${n} ${from}: comes back to ${from} itself (↩), ${colourWords(shot.color)}`;
  return `#${n} ${from} → ${torchName(board, shot.exit)}, ${colourWords(shot.color)}`;
}

function planJewels(state: PrismjackState, saved: Saved): PlacedJewel[] {
  return Object.entries(saved.placed).flatMap(([k, p]) => {
    const spec = state.jewels[Number(k) - 1];
    const shape = spec ? orientations(spec.shape.cells)[p.orient - 1] : undefined;
    if (!spec || !shape) return [];
    return [{ id: Number(k), shapeId: spec.shape.id, color: spec.color, cells: shape.map((c) => ({ x: c.x + p.col - 1, y: c.y + p.row - 1, part: c.part })) }];
  });
}

function showRoom(state: PrismjackState, saved: Saved, log: string[]): string {
  const { board, pillars = [] } = state.puzzle;
  const plan = planJewels(state, saved);
  const cellText = (x: number, y: number): string => {
    for (const p of pillars) {
      const c = p.cells.find((q) => q.x === x && q.y === y);
      if (c) return GLYPH[c.part] + KIND[p.kind];
    }
    for (const j of plan) {
      const c = j.cells.find((q) => q.x === x && q.y === y);
      if (c) return GLYPH[c.part] + String(j.id);
    }
    return '· ';
  };
  const head = (prefix: string) => '     ' + Array.from({ length: board.width }, (_, i) => `${prefix}${i + 1}`.padEnd(3)).join('');
  const lines = [`Level ${saved.level + 1} — room ${board.width} columns × ${board.height} rows`, head('T')];
  for (let y = 0; y < board.height; y++) {
    lines.push(`L${y + 1}`.padEnd(4) + ' ' + Array.from({ length: board.width }, (_, x) => cellText(x, y).padEnd(3)).join('') + ` R${y + 1}`);
  }
  lines.push(head('B'));
  lines.push('Legend: · empty cell; glyph + k/c/p = black/clear/prism pillar; glyph + number = jewel on YOUR plan.');
  pillars.forEach((p, i) => {
    if (p.kind === 'prism') lines.push(`Prism pillar: colours in order ${p.order?.join(' → ')}; current colour now: ${p.order?.[(state.pillarStates[i] ?? 0) % 4]}`);
  });
  lines.push('Loot (jewels to find, shapes may be rotated or flipped):');
  state.jewels.forEach((j, i) => lines.push(`  jewel ${i + 1}: ${j.color} ${j.shape.id}${saved.placed[String(i + 1)] ? ' (on plan)' : ''}`));
  lines.push(`Tests so far: ${state.shots.length} (alarm stays quiet up to ${state.thresholds.quiet} tests). Wrong plans: ${saved.wrongPlans}. Alarm level: ${alarms(state)}/3.`);
  lines.push(...log.map((l) => '  ' + l));
  return lines.join('\n');
}

/** A game in progress, rebuilt from the saved file. */
interface Game {
  readonly saved: Saved;
  readonly state: PrismjackState;
  readonly log: string[];
  readonly board: BoardSize;
}

const without = (placed: Saved['placed'], key: string): Saved['placed'] => Object.fromEntries(Object.entries(placed).filter(([k]) => k !== key));

function newGame(rest: string[]): string {
  const level = Number(rest[0]) - 1;
  if (!(level >= 0 && level < LEVEL_ROOMS.length)) return `Level must be 1..${LEVEL_ROOMS.length}`;
  const saved: Saved = { level, variant: Number(rest[1] ?? 0) % 4, fired: [], placed: {}, wrongPlans: 0 };
  save(saved);
  return showRoom(build(saved).state, saved, []);
}

function shapes({ state }: Game): string {
  return state.jewels
    .map((j, i) => `jewel ${i + 1} (${j.color} ${j.shape.id}):\n` + orientations(j.shape.cells).map((o, k) => `  orientation ${k + 1}:\n${drawCells(o)}`).join('\n'))
    .join('\n');
}

function fire({ saved, state, board }: Game, rest: string[]): string {
  const port = parseTorch(board, rest[0] ?? '');
  if (port === undefined) return 'Unknown torch. Use T1..T' + board.width + ', B1..B' + board.width + ', L1..L' + board.height + ', R1..R' + board.height;
  const r = fireLaser(state, port);
  if (!r.isNew) return `Torch ${rest[0]} is already lit by an earlier test (no new test): ${describeShot(board, r.shot, 0).replace('#0 ', '')}`;
  saved.fired.push(port);
  save(saved);
  return describeShot(board, r.shot, r.state.shots.length) + `\nTests: ${r.state.shots.length}, alarm ${alarms({ ...r.state, wrongPlans: saved.wrongPlans })}/3`;
}

/** "place 2 1 3 4" → jewel 2, orientation 1, column 3, row 4 (null when it does not name a real jewel and orientation). */
function placement({ state }: Game, rest: string[]): { j: number; orient: number; col: number; row: number } | null {
  const [j = 0, orient = 0, col = 0, row = 0] = rest.map(Number);
  const spec = state.jewels[j - 1];
  return spec && orientations(spec.shape.cells)[orient - 1] && col && row ? { j, orient, col, row } : null;
}

function place(game: Game, rest: string[]): string {
  const { saved, state, board } = game;
  const p = placement(game, rest);
  if (!p) return 'Usage: place <jewel#> <orientation#> <col> <row>';
  const { j, orient, col, row } = p;
  saved.placed[String(j)] = { orient, col, row };
  if (planJewels(state, saved).find((q) => q.id === j)?.cells.some((c) => !isInside(board, c.x, c.y))) {
    saved.placed = without(saved.placed, String(j));
    return 'That jewel would stick out of the room.';
  }
  save(saved);
  return showRoom(state, saved, game.log);
}

function remove(game: Game, rest: string[]): string {
  game.saved.placed = without(game.saved.placed, rest[0] ?? '');
  save(game.saved);
  return showRoom(game.state, game.saved, game.log);
}

function go({ saved, state, board }: Game): string {
  const plan = jewelSurfaces(board, planJewels(state, saved));
  const result = submitPlan({ ...state, plan });
  if (result.kind === 'empty-plan') return 'Your plan is empty.';
  if (result.kind === 'success') saved.outcome = `SUCCESS with ${state.shots.length} tests, alarm ${result.alarms}/3`;
  else saved.wrongPlans += 1;
  if (result.kind === 'caught') saved.outcome = 'CAUGHT: the alarm reached 3/3, the heist failed.';
  save(saved);
  if (saved.outcome) return saved.outcome;
  const wrong = result.kind === 'alarm' ? result.mismatches.map((p) => torchName(board, p)).join(', ') : '';
  return `WRONG PLAN: the alarm goes up (${alarms(result.state)}/3). Torches where your plan gives a different result: ${wrong}`;
}

const COMMANDS: Record<string, (game: Game, rest: string[]) => string> = {
  room: (g) => showRoom(g.state, g.saved, g.log),
  shapes,
  fire,
  place,
  remove,
  go,
};

function main(args: string[]): string {
  const [cmd = 'room', ...rest] = args;
  if (cmd === 'new') return newGame(rest);
  if (!existsSync(FILE)) return 'No game: run "new <level>" first.';
  const saved = load();
  if (saved.outcome) return `This heist is over: ${saved.outcome}`;
  const built = build(saved);
  const state = { ...built.state, wrongPlans: saved.wrongPlans };
  const command = COMMANDS[cmd];
  if (!command) return 'Commands: new <level> | room | shapes | fire <torch> | place <jewel#> <orientation#> <col> <row> | remove <jewel#> | go';
  return command({ saved, state, log: built.log, board: state.puzzle.board }, rest);
}

console.log(main(process.argv.slice(2)));
