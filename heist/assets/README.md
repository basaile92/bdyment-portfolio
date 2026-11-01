# App assets (iOS / Android)

Source images for `@capacitor/assets`, which generates every icon size and launch screen:

- `icon-only.png` — app icon, 1024 × 1024, opaque (iOS rejects transparency)
- `splash.png`, `splash-dark.png` — launch screen, 2732 × 2732 (content kept in the centre: it is cropped to each screen)
- `icon-source.svg` — the vector the icon is rendered from

```bash
npx @capacitor/assets generate --ios
```
