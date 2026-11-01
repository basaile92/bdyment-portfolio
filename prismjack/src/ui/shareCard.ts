import { ABSORBED, portSide, type BoardSize, type Pillar, type PortId } from '../domain';
import { JEWEL_HEX, laserHex } from './presenters/palette';
import { colorSlices } from './presenters/portSlices';

/**
 * The picture shared at the end of a daily heist or a run: the room seen from the roof, with the
 * torches lit in the order they were tested (never the jewels), and the result underneath.
 * Drawn on a canvas with the fonts the page already loaded, then exported as a PNG.
 */
export interface ShareCard {
  readonly board: BoardSize;
  readonly pillars: readonly Pillar[];
  readonly shots: readonly { entry: PortId; exit: PortId; color: number }[];
  readonly title: string;
  readonly subtitle: string;
  readonly result: string;
  /** Alarm level reached, 0-3 (null: no alarm row). */
  readonly alarms: number | null;
  readonly extra: string;
  readonly url: string;
}

const W = 1080;
const H = 1350;
const TITLE_FONT = '"Bungee", system-ui, sans-serif';
const TEXT_FONT = '"Nunito", system-ui, sans-serif';

export async function renderShareCard(card: ShareCard): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  drawCard(ctx, card);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png export failed'))), 'image/png'));
}

function drawCard(ctx: CanvasRenderingContext2D, card: ShareCard): void {
  const bg = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 200, H);
  bg.addColorStop(0, '#2b3a95');
  bg.addColorStop(0.6, '#151a4a');
  bg.addColorStop(1, '#0b0f30');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#6b3a10';
  ctx.font = `110px ${TITLE_FONT}`;
  ctx.fillText(card.title, W / 2, 168);
  ctx.fillStyle = '#ffc93c';
  ctx.fillText(card.title, W / 2, 160);
  ctx.fillStyle = '#b9c6ff';
  ctx.font = `800 42px ${TEXT_FONT}`;
  ctx.fillText(card.subtitle.toUpperCase(), W / 2, 232);

  drawRoom(ctx, card, { x: 90, y: 290, size: 900 - 90 * 2 + 180 });

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 58px ${TEXT_FONT}`;
  ctx.fillText(card.result, W / 2, 1125);
  if (card.alarms !== null) drawAlarms(ctx, card.alarms, 1185);
  ctx.fillStyle = '#ffc93c';
  ctx.font = `900 42px ${TEXT_FONT}`;
  if (card.extra) ctx.fillText(card.extra, W / 2, card.alarms !== null ? 1262 : 1200);
  ctx.fillStyle = '#8f9bd6';
  ctx.font = `800 32px ${TEXT_FONT}`;
  ctx.fillText(card.url, W / 2, 1318);
}

interface Area { x: number; y: number; size: number }

function drawRoom(ctx: CanvasRenderingContext2D, card: ShareCard, area: Area): void {
  const { width: w, height: h } = card.board;
  // Room plus one lamp ring all around.
  const unit = Math.min(area.size / (w + 2), 760 / (h + 2));
  const ox = W / 2 - (unit * (w + 2)) / 2 + unit;
  const oy = area.y + (760 - unit * (h + 2)) / 2 + unit;
  const px = (x: number, y: number): [number, number] => [ox + x * unit, oy + y * unit];

  ctx.fillStyle = 'rgba(10, 14, 50, 0.55)';
  roundRect(ctx, ox - unit * 0.9, oy - unit * 0.9, unit * (w + 1.8), unit * (h + 1.8), unit * 0.5);
  ctx.fill();
  ctx.fillStyle = '#283586';
  ctx.fillRect(ox, oy, unit * w, unit * h);
  ctx.strokeStyle = 'rgba(170, 195, 255, 0.28)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= w; x++) line(ctx, px(x, 0), px(x, h));
  for (let y = 0; y <= h; y++) line(ctx, px(0, y), px(w, y));

  for (const pillar of card.pillars) drawPillar(ctx, pillar, px, unit);
  drawLamps(ctx, card, px, unit);
}

function drawPillar(ctx: CanvasRenderingContext2D, pillar: Pillar, px: (x: number, y: number) => [number, number], unit: number): void {
  const xs = pillar.cells.map((c) => c.x), ys = pillar.cells.map((c) => c.y);
  const [x0, y0] = px(Math.min(...xs), Math.min(...ys));
  const [x1, y1] = px(Math.max(...xs) + 1, Math.max(...ys) + 1);
  ctx.beginPath();
  if (pillar.shape === 'losange2') {
    ctx.moveTo((x0 + x1) / 2, y0); ctx.lineTo(x1, (y0 + y1) / 2); ctx.lineTo((x0 + x1) / 2, y1); ctx.lineTo(x0, (y0 + y1) / 2);
  } else {
    ctx.rect(x0, y0, x1 - x0, y1 - y0);
  }
  ctx.closePath();
  ctx.fillStyle = pillar.kind === 'black' ? '#06060c' : pillar.kind === 'clear' ? '#b9cdf0' : 'rgba(255, 210, 63, 0.35)';
  ctx.fill();
  ctx.lineWidth = unit * 0.06;
  ctx.strokeStyle = pillar.kind === 'prism' ? '#ffd23f' : pillar.kind === 'clear' ? '#ffffff' : '#5a5a78';
  ctx.stroke();
}

function lampCentre(board: BoardSize, port: PortId, px: (x: number, y: number) => [number, number]): [number, number] {
  const { side, index } = portSide(board, port);
  const off = 0.62;
  switch (side) {
    case 'top': return px(index + 0.5, -off);
    case 'bottom': return px(index + 0.5, board.height + off);
    case 'left': return px(-off, index + 0.5);
    case 'right': return px(board.width + off, index + 0.5);
  }
}

function drawLamps(ctx: CanvasRenderingContext2D, card: ShareCard, px: (x: number, y: number) => [number, number], unit: number): void {
  const lit = new Map<PortId, { color: number; n: number; absorbed: boolean }>();
  card.shots.forEach((s, i) => {
    lit.set(s.entry, { color: s.color, n: i + 1, absorbed: s.exit === ABSORBED });
    if (s.exit !== ABSORBED && !lit.has(s.exit)) lit.set(s.exit, { color: s.color, n: i + 1, absorbed: false });
  });
  const r = unit * 0.36;
  const ports = 2 * (card.board.width + card.board.height);
  for (let port = 0; port < ports; port++) {
    const [cx, cy] = lampCentre(card.board, port, px);
    circle(ctx, cx, cy, r, '#a7adc7');
    const l = lit.get(port);
    const inner = r * 0.78;
    if (!l) { circle(ctx, cx, cy, inner, '#2c3152'); continue; }
    if (l.absorbed) circle(ctx, cx, cy, inner, '#05050a');
    else if (!l.color) {
      circle(ctx, cx, cy, inner, '#2c3152');
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = unit * 0.05;
      line(ctx, [cx - inner * 0.55, cy + inner * 0.55], [cx + inner * 0.55, cy - inner * 0.55]);
    } else {
      const slices = colorSlices(l.color, { x: 0, y: 0 }, inner);
      if (!slices.length) { circle(ctx, cx, cy, inner, laserHex(l.color)); continue; }
      ctx.save();
      ctx.translate(cx, cy);
      for (const slice of slices) {
        ctx.fillStyle = JEWEL_HEX[slice.color];
        ctx.fill(new Path2D(slice.path));
      }
      ctx.restore();
    }
  }
}

function drawAlarms(ctx: CanvasRenderingContext2D, level: number, y: number): void {
  for (let i = 0; i < 3; i++) {
    const x = W / 2 + (i - 1) * 74;
    circle(ctx, x, y, 26, i < level ? '#ff4d6d' : '#2c3152');
    ctx.lineWidth = 4;
    ctx.strokeStyle = i < level ? '#ffb3c0' : '#4a5290';
    ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.stroke();
  }
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function line(ctx: CanvasRenderingContext2D, a: [number, number], b: [number, number]): void {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
