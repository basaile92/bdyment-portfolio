import { it } from 'vitest';
import { appendFileSync, writeFileSync } from 'node:fs';
import { allPorts } from '../src/domain/board';
import { EXPERT_POOL, EXTREME_POOL, HARD_POOL, INSANE_POOL, LEVEL_ROOMS, MEDIUM_POOL, NIGHTMARE_POOL } from '../src/domain/campaignRooms';
import { storedSpecs, type StoredRoom } from '../src/domain/rooms';
import { allPlacements } from './diamondSolver';
import { fireInOrder, Room, solve } from './solver';

/** GEN=verify: every stored room still has exactly one solution when every torch is fired. */
const log = (s: string) => appendFileSync('/tmp/verify.log', s + '\n');

function unique(room: StoredRoom): string {
  const specs = storedSpecs(room);
  const r = new Room(room.board, room.pillars ?? []);
  room.jewels.forEach((cells, i) => {
    const key = cells.map(([x, y, part]) => `${x},${y},${part}`).sort().join(' ');
    const p = allPlacements(room.board, specs[i]!, i).find((q) => q.cells.map((c) => `${c.x},${c.y},${c.part}`).sort().join(' ') === key);
    if (!p) throw new Error('jewel placement not found');
    r.apply(p, true);
  });
  const all = fireInOrder(r, allPorts(room.board));
  const res = solve(room.board, room.pillars ?? [], specs, all, { maxNodes: 5_000_000 });
  return res.aborted ? 'aborted' : String(res.count);
}

it.skipIf(process.env.GEN !== 'verify')('every stored room has a single solution', () => {
  writeFileSync('/tmp/verify.log', '');
  const sets = { LEVEL_ROOMS, MEDIUM_POOL, HARD_POOL, EXPERT_POOL, EXTREME_POOL, INSANE_POOL, NIGHTMARE_POOL };
  for (const [name, rooms] of Object.entries(sets)) {
    const bad = rooms.map((room, i) => [i, unique(room)] as const).filter(([, c]) => c !== '1');
    log(`${name}: ${rooms.length} rooms, not unique: ${JSON.stringify(bad)}`);
  }
}, 7_200_000);
