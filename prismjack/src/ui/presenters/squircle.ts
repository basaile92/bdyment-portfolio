/**
 * iOS "continuous" corners (squircle): the curvature eases in instead of jumping from a straight edge
 * to a circular arc, as CSS border-radius does. Constants of the iOS 7+ rounded rectangle, per corner:
 * the curve starts 1.52866483 r from the corner. When the box is too small for that (a pill),
 * the radius shrinks so both corners meet: a continuous capsule.
 */
const K = 1.52866483;

export function squirclePath(width: number, height: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2 / K));
  const w = width, h = height;
  const p = (x: number, y: number) => `${round(x)} ${round(y)}`;
  // One corner, expressed from its own origin and mirrored by (sx, sy).
  const corner = (cx: number, cy: number, sx: number, sy: number, horizontalFirst: boolean) => {
    const pt = (a: number, b: number) => (horizontalFirst ? p(cx + sx * a * r, cy + sy * b * r) : p(cx + sx * b * r, cy + sy * a * r));
    return [
      `C ${pt(1.08849299, 0)} ${pt(0.86840701, 0)} ${pt(0.63149399, 0.074911)}`,
      `C ${pt(0.37282392, 0.16905899)} ${pt(0.16905899, 0.37282392)} ${pt(0.074911, 0.63149399)}`,
      `C ${pt(0, 0.86840701)} ${pt(0, 1.08849299)} ${pt(0, K)}`,
    ].join(' ');
  };
  return [
    `M ${p(K * r, 0)}`,
    `L ${p(w - K * r, 0)}`,
    corner(w, 0, -1, 1, true),
    `L ${p(w, h - K * r)}`,
    corner(w, h, -1, -1, false),
    `L ${p(K * r, h)}`,
    corner(0, h, 1, -1, true),
    `L ${p(0, K * r)}`,
    corner(0, 0, 1, 1, false),
    'Z',
  ].join(' ');
}

function round(n: number): string {
  return String(Math.round(n * 100) / 100);
}
