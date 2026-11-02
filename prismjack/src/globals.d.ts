/** The game's version, from package.json (vite.config.ts). */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  /** "1" in end-to-end test builds: exposes the game controller as window.__game. */
  readonly VITE_E2E?: string;
  readonly VITE_APP_STORE_ID?: string;
}
