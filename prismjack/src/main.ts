/**
 * Composition root: the only place that knows the concrete adapters.
 * It picks native or web implementations of the ports and starts the game.
 */
import { Capacitor } from '@capacitor/core';
import { mount } from 'svelte';
import { DeviceHaptics } from './adapters/DeviceHaptics';
import { DeviceSharer } from './adapters/DeviceSharer';
import { appStoreUrl } from './ui/appStore';
import { NativeProgressStore } from './adapters/NativeProgressStore';
import { SeededRandom } from './adapters/SeededRandom';
import { WebAudioSound } from './adapters/WebAudioSound';
import { WebProgressStore } from './adapters/WebProgressStore';
import App from './ui/App.svelte';
import { GameController } from './ui/GameController.svelte';
import { detectLanguage } from './ui/i18n/strings';
import './ui/styles.css';

const native = Capacitor.isNativePlatform();

const game = new GameController({
  randomFor: (seed) => (seed === null ? SeededRandom.fromClock() : new SeededRandom(seed)),
  progress: native ? new NativeProgressStore() : new WebProgressStore(),
  haptics: new DeviceHaptics(native),
  sharer: new DeviceSharer(native),
  appStoreUrl: appStoreUrl(import.meta.env.VITE_APP_STORE_ID, native, navigator),
  sound: new WebAudioSound(),
  today: () => new Date(),
  deviceLanguage: detectLanguage(navigator.language),
});

mount(App, { target: document.getElementById('app') as HTMLElement, props: { game } });
void game.init();

// Exposed for end-to-end tests only.
if (import.meta.env.DEV || new URLSearchParams(location.search).has('e2e')) Object.assign(window, { __game: game });
