/**
 * Composition root: the only place that knows the concrete adapters.
 * It picks native or web implementations of the ports and starts the game.
 */
import { Capacitor } from '@capacitor/core';
import { mount } from 'svelte';
import { DeviceHaptics } from './adapters/DeviceHaptics';
import { DeviceSharer } from './adapters/DeviceSharer';
import { appStoreUrl } from './ui/appStore';
import { nativeStorage } from './adapters/NativeProgressStore';
import { SeededRandom } from './adapters/SeededRandom';
import { WebAudioSound } from './adapters/WebAudioSound';
import { StoredProgress } from './adapters/StoredProgress';
import { webStorage } from './adapters/WebProgressStore';
import App from './ui/App.svelte';
import { GameController } from './ui/GameController.svelte';
import { detectLanguage } from './ui/i18n/strings';
import './ui/styles.css';

const native = Capacitor.isNativePlatform();

const game = new GameController({
  randomFor: (seed) => (seed === null ? SeededRandom.fromClock() : new SeededRandom(seed)),
  progress: new StoredProgress(native ? nativeStorage : webStorage),
  haptics: new DeviceHaptics(native),
  sharer: new DeviceSharer(native),
  appStoreUrl: appStoreUrl(import.meta.env.VITE_APP_STORE_ID, native, navigator),
  sound: new WebAudioSound(),
  today: () => new Date(),
  deviceLanguage: detectLanguage(navigator.language),
});

mount(App, { target: document.getElementById('app') as HTMLElement, props: { game } });
void game.init();

// Exposed for end-to-end tests only: dev server, or a test build (VITE_E2E=1). Never in the published game.
if (import.meta.env.DEV || import.meta.env.VITE_E2E === '1') Object.assign(window, { __game: game });
