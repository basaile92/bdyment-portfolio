/**
 * Board geometry: a W×H grid of cells surrounded by laser ports.
 *
 * Ports are numbered clockwise starting from the top-left:
 *   top    : 0 .. W-1             (left → right)
 *   right  : W .. W+H-1           (top → bottom)
 *   bottom : W+H .. 2W+H-1        (left → right)
 *   left   : 2W+H .. 2W+2H-1      (top → bottom)
 */
export interface BoardSize {
  readonly width: number;
  readonly height: number;
}

export type PortId = number;
export type Side = 'top' | 'right' | 'bottom' | 'left';

export interface Position {
  readonly x: number;
  readonly y: number;
}

export interface Heading extends Position {
  readonly dx: number;
  readonly dy: number;
}

export const DEFAULT_BOARD: BoardSize = { width: 8, height: 10 };

export function portCount(board: BoardSize): number {
  return 2 * board.width + 2 * board.height;
}

export function allPorts(board: BoardSize): PortId[] {
  return Array.from({ length: portCount(board) }, (_, i) => i);
}

export function isInside(board: BoardSize, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < board.width && y < board.height;
}

export function cellIndex(board: BoardSize, x: number, y: number): number {
  return y * board.width + x;
}

export function cellAt(board: BoardSize, index: number): Position {
  return { x: index % board.width, y: Math.floor(index / board.width) };
}

export function portSide(board: BoardSize, port: PortId): { side: Side; index: number } {
  const { width: w, height: h } = board;
  if (port < w) return { side: 'top', index: port };
  if (port < w + h) return { side: 'right', index: port - w };
  if (port < 2 * w + h) return { side: 'bottom', index: port - w - h };
  return { side: 'left', index: port - 2 * w - h };
}

export function portFor(board: BoardSize, side: Side, index: number): PortId {
  const { width: w, height: h } = board;
  const offset = { top: 0, right: w, bottom: w + h, left: 2 * w + h }[side];
  return offset + index;
}

/** The cell a laser enters first, and the direction it travels. */
export function portEntry(board: BoardSize, port: PortId): Heading {
  const { side, index } = portSide(board, port);
  switch (side) {
    case 'top': return { x: index, y: 0, dx: 0, dy: 1 };
    case 'right': return { x: board.width - 1, y: index, dx: -1, dy: 0 };
    case 'bottom': return { x: index, y: board.height - 1, dx: 0, dy: -1 };
    case 'left': return { x: 0, y: index, dx: 1, dy: 0 };
  }
}

/** The port reached by a laser standing on a position just outside the grid. */
export function portOutside(board: BoardSize, x: number, y: number): PortId {
  if (y < 0) return portFor(board, 'top', x);
  if (x >= board.width) return portFor(board, 'right', y);
  if (y >= board.height) return portFor(board, 'bottom', x);
  return portFor(board, 'left', y);
}
