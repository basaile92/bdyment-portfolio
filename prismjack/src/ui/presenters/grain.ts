/**
 * The frosted roof's grain: a small tile of pale noise drawn once on a canvas.
 * (An SVG turbulence filter looked the same but was recomputed on every repaint of the room.)
 */
export function grainTile(size = 96, seed = 7): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const image = ctx.createImageData(size, size);
  let s = seed;
  for (let i = 0; i < image.data.length; i += 4) {
    s = (s * 1103515245 + 12345) % 2147483648;
    image.data[i] = 204;
    image.data[i + 1] = 224;
    image.data[i + 2] = 255;
    image.data[i + 3] = Math.floor((s / 2147483648) * 0.16 * 255);
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}
