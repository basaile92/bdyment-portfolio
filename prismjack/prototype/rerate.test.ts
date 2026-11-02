import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { allPorts } from '../src/domain/board';
import { LEVEL_ROOMS } from '../src/domain/campaignRooms';
import { storedSpecs } from '../src/domain/rooms';
import { allPlacements } from './diamondSolver';
import { fireInOrder, Room, solve } from './solver';

/**
 * GEN=rerate FROM=30 TO=50: how much reasoning each stored level takes — the solver's search nodes to prove
 * the single solution once every torch is lit (a stable, fast proxy; simulated players are too slow on 6-7 jewels).
 */
it.skipIf(process.env.GEN !== 'rerate')('rates stored levels', () => {
  const from = Number(process.env.FROM ?? 30), to = Number(process.env.TO ?? 50);
  const out: Record<number, number> = {};
  for (let i = from; i < to; i++) {
    const room = LEVEL_ROOMS[i]!;
    const specs = storedSpecs(room);
    const r = new Room(room.board, room.pillars ?? []);
    room.jewels.forEach((cells, j) => {
      const key = cells.map(([x, y, part]) => `${x},${y},${part}`).sort().join(' ');
      r.apply(allPlacements(room.board, specs[j]!, j).find((q) => q.cells.map((c) => `${c.x},${c.y},${c.part}`).sort().join(' ') === key)!, true);
    });
    out[i] = solve(room.board, room.pillars ?? [], specs, fireInOrder(r, allPorts(room.board)), { maxNodes: 5_000_000 }).nodes;
    writeFileSync('/tmp/rerate.json', JSON.stringify(out));
  }
}, 600_000);
