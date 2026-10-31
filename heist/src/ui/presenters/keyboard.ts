import type { Strings } from '../i18n/strings';
import { portFor, portSide, type BoardSize, type CellSide, type PortId } from '../../domain';

/**
 * Keyboard play (accessibility): a cursor moves over the cells and, past the
 * edges, over the emitters. Enter fires from an emitter; on a cell, letters draw.
 */
export type Cursor = { readonly kind: 'cell'; readonly x: number; readonly y: number } | { readonly kind: 'port'; readonly port: PortId };

const STEP: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

export const WALL_KEYS: Record<string, CellSide> = { h: 'T', b: 'B', g: 'L', d: 'R' };
export const FACET_KEYS: Record<string, '/' | '\\'> = { '/': '/', '\\': '\\', a: '/', z: '\\' };

function fromPort(board: BoardSize, port: PortId, dx: number, dy: number): Cursor {
  const { side, index } = portSide(board, port);
  const inward = { top: [0, 1], bottom: [0, -1], left: [1, 0], right: [-1, 0] }[side];
  if (dx === inward[0] && dy === inward[1]) {
    if (side === 'top') return { kind: 'cell', x: index, y: 0 };
    if (side === 'bottom') return { kind: 'cell', x: index, y: board.height - 1 };
    if (side === 'left') return { kind: 'cell', x: 0, y: index };
    return { kind: 'cell', x: board.width - 1, y: index };
  }
  const along = side === 'top' || side === 'bottom' ? dx : dy;
  const size = side === 'top' || side === 'bottom' ? board.width : board.height;
  const next = Math.min(size - 1, Math.max(0, index + along));
  return { kind: 'port', port: portFor(board, side, next) };
}

function fromCell(board: BoardSize, { x, y }: { x: number; y: number }, dx: number, dy: number): Cursor {
  const nx = x + dx;
  const ny = y + dy;
  if (ny < 0) return { kind: 'port', port: portFor(board, 'top', x) };
  if (ny >= board.height) return { kind: 'port', port: portFor(board, 'bottom', x) };
  if (nx < 0) return { kind: 'port', port: portFor(board, 'left', y) };
  if (nx >= board.width) return { kind: 'port', port: portFor(board, 'right', y) };
  return { kind: 'cell', x: nx, y: ny };
}

export function moveCursor(board: BoardSize, cursor: Cursor | null, key: string): Cursor | null {
  const step = STEP[key];
  if (!step) return null;
  if (!cursor) return { kind: 'cell', x: 0, y: 0 };
  return cursor.kind === 'port' ? fromPort(board, cursor.port, ...step) : fromCell(board, cursor, ...step);
}

export function describeCursor(board: BoardSize, cursor: Cursor, s: Strings): string {
  if (cursor.kind === 'cell') return s.cellAt(cursor.x + 1, cursor.y + 1);
  const { side, index } = portSide(board, cursor.port);
  return s.emitterAt(index + 1, side);
}
