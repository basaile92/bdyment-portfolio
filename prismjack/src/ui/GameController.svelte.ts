import {
  alarms, testsLimit, testsUsed, untilNextDay, clearPlan, dailySeed, dayOf, drawSurface, EMPTY_HISTORY, fireLaser, jewelsFor, markEmpty,
  missingJewels, recordCaught, recordPrismjack, resetProgress, redo, remember, saveSettings, shotAt, startPrismjack, submitPlan, undo,
  type PrismjackMode, type PrismjackState, type PlanHistory, type Shot,
} from '../application';
import { recognizedJewels, type JewelColor, type PortId, type Surface, type SurfaceKey } from '../domain';
import type { Haptics } from '../ports/Haptics';
import { NO_PROGRESS, type Progress, type ProgressStore, type Settings } from '../ports/ProgressStore';
import type { RandomSource } from '../ports/RandomSource';
import type { Sound } from '../ports/Sound';
import type { Tool } from './presenters/boardGeometry';
import type { Speech } from './presenters/messages';
import { stringsFor, type Language, type Strings } from './i18n/strings';
import { tipText, type TipEvent } from './presenters/tips';

export interface GameDependencies {
  readonly randomFor: (seed: number | null) => RandomSource;
  readonly progress: ProgressStore;
  readonly haptics: Haptics;
  readonly sound: Sound;
  readonly today: () => Date;
  /** The device language, used until the player picks one. */
  readonly deviceLanguage: Language;
}

export type Dialog = 'none' | 'welcome' | 'help' | 'menu' | 'settings' | 'confirm-new' | 'confirm-clear' | 'confirm-go' | 'win' | 'caught';

/** GO animation: drop out of the window, climb back, keep the face a moment. */
const DIVE_MS = 650;
const RISE_MS = 700;
/** Phones, where the thief is hidden: come into view, pause, then a slower drop. */
const PHONE_PORTRAIT = '(max-width: 599px) and (max-aspect-ratio: 1/1)';
const ENTER_MS = 450;
const PAUSE_MS = 500;
const PHONE_DIVE_MS = 950;
const MOOD_MS = 2200;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Two taps on emitters closer than this are treated as one (avoids paying a test for a slip). */
const DOUBLE_TAP_MS = 350;
const REVEAL_STEP_MS = 380;

/**
 * View-model of the game screen: holds the reactive UI state and turns user
 * gestures into use-case calls. It contains no game rule itself.
 */
export class GameController {
  // Immutable values: raw state keeps object identity and is cheaper than deep proxies.
  prismjack = $state.raw<PrismjackState>() as PrismjackState;
  history = $state.raw<PlanHistory>(EMPTY_HISTORY);
  mode = $state.raw<PrismjackMode>({ kind: 'free' });
  progress = $state.raw<Progress>(NO_PROGRESS);
  selected = $state.raw<Shot | null>(null);
  flashed = $state.raw<Shot | null>(null);
  result = $state.raw<{ alarms: number } | null>(null);
  tool = $state<Tool>('trace');
  color = $state<JewelColor>('red');
  speech = $state<Speech>({ kind: 'intro' });
  dialog = $state<Dialog>('none');
  alarmTick = $state(0);
  /** GO: the thief drops below the window ('down'), then climbs back ('up') or, loot in hand, right out of the top ('escape'). */
  dive = $state<'none' | 'enter' | 'down' | 'up' | 'escape'>('none');
  /** The thief's face after a GO. */
  mood = $state<'calm' | 'sad' | 'happy'>('calm');
  /** Number of jewels revealed by the victory sequence. */
  revealed = $state(0);

  /** Tests fired so far, and how many light every sensor (end of the gauge). */
  readonly tests = $derived(testsUsed(this.prismjack));
  readonly limit = $derived(testsLimit(this.prismjack));
  /** Alarm level, 0 (perfect) to 3 (the guard arrives). */
  readonly alarms = $derived(alarms(this.prismjack));
  readonly sirenOn = $derived(this.alarms > 0);
  readonly won = $derived(this.prismjack.status === 'success');
  readonly over = $derived(this.prismjack.status !== 'planning');
  readonly recognized = $derived(recognizedJewels(this.prismjack.puzzle.board, this.prismjack.plan, this.prismjack.jewels));
  readonly settings = $derived(this.progress.settings);
  get language(): Language {
    return this.progress.settings.language ?? this.deps.deviceLanguage;
  }

  /** Shapes doubling the colours (colour blindness): an option, off by default. */
  get symbols(): boolean {
    return this.progress.settings.symbols ?? false;
  }

  /** Every text of the interface, in the current language. */
  get s(): Strings {
    return stringsFor(this.language);
  }

  private lastFire = 0;
  /** Plain (non-reactive) list: tips are bookkeeping, nothing renders from it. */
  private tipsShown: TipEvent[] = [];

  constructor(private readonly deps: GameDependencies) {
    this.prismjack = startPrismjack(deps.randomFor(null));
  }

  async init(): Promise<void> {
    this.progress = await this.deps.progress.load();
    this.deps.sound.setEnabled(this.settings.sound);
    this.start(this.firstMode());
    if (this.settings.language === undefined) this.dialog = 'welcome';
  }

  private firstMode(): PrismjackMode {
    return this.dailyDone ? { kind: 'free' } : { kind: 'daily', day: this.today() };
  }

  private today(): string {
    return dayOf(this.deps.today());
  }

  /** The daily prismjack is one attempt a day, won or caught. */
  get dailyDone(): boolean {
    return this.progress.lastDailyPlayed === this.today();
  }

  /** "7 h 12" before the next daily prismjack. */
  nextDailyIn(): string {
    const { hours, minutes } = untilNextDay(this.deps.today());
    return this.s.duration(hours, minutes);
  }

  // ---------- prismjacks ----------

  start(mode: PrismjackMode): void {
    const seed = mode.kind === 'daily' ? dailySeed(mode.day) : null;
    this.mode = mode;
    this.prismjack = startPrismjack(this.deps.randomFor(seed), { jewels: jewelsFor(mode) });
    this.history = EMPTY_HISTORY;
    this.selected = null;
    this.flashed = null;
    this.result = null;
    this.revealed = 0;
    this.dive = 'none';
    this.mood = 'calm';
    this.dialog = 'none';
    this.tipsShown = [];
    this.speech = { kind: 'intro' };
    this.tip('start');
  }

  startDaily(): void {
    this.start(this.dailyDone ? { kind: 'free' } : { kind: 'daily', day: this.today() });
  }

  requestMenu(): void {
    this.dialog = 'menu';
  }

  /** Retry the same room; the daily prismjack allows a single attempt, so a free one replaces it. */
  replay(): void {
    if (this.mode.kind === 'daily') this.startDaily();
    else this.start(this.mode);
  }

  readonly continueLabel = $derived(
    this.won ? (this.mode.kind === 'training' && this.mode.level < 3 ? this.s.next : this.s.nextPrismjack) : this.mode.kind === 'daily' ? this.s.freePrismjack : this.s.retry,
  );

  /** After a finished prismjack: the obvious next step. */
  continueAfter(): void {
    if (this.won || this.mode.kind === 'daily') this.next();
    else this.replay();
  }

  next(): void {
    const m = this.mode;
    if (m.kind === 'training' && m.level < 3) this.start({ kind: 'training', level: (m.level + 1) as 2 | 3 });
    else if (m.kind === 'training' && !this.dailyDone) this.startDaily();
    else this.start({ kind: 'free' });
  }

  // ---------- laser tests ----------

  /** Haptic tick while the finger slides from one drawing target to another. */
  feel(): void {
    this.deps.haptics.tick();
  }

  fire(port: PortId): void {
    if (this.over) return;
    const known = shotAt(this.prismjack, port);
    const now = Date.now();
    if (!known && now - this.lastFire < DOUBLE_TAP_MS) return;
    const { state, shot, isNew } = fireLaser(this.prismjack, port);
    this.prismjack = state;
    this.selected = shot;
    const number = this.prismjack.shots.indexOf(shot) + 1;
    this.speech = { kind: 'shot', number, shot };
    if (!isNew) return;
    this.lastFire = now;
    this.flashed = shot;
    this.deps.sound.play('laser');
    this.deps.haptics.tap();
    const tip = this.tipAfterShot(shot);
    if (tip) this.speech = { kind: 'shot', number, shot, tip };
    if (this.prismjack.status === 'caught') this.caught();
  }

  private tipAfterShot(shot: Shot): string | null {
    return this.takeTip('first-shot') ?? (shot.exit === shot.entry ? this.takeTip('back') : null) ?? this.takeTip(shot.color ? 'colored' : 'transparent');
  }

  shotAt(port: PortId): Shot | undefined {
    return shotAt(this.prismjack, port);
  }

  // ---------- drawing ----------

  private change(next: PrismjackState): void {
    const before = this.prismjack;
    const foundBefore = this.recognized.filter(Boolean).length;
    this.history = remember(this.history, before, next);
    this.prismjack = next;
    const found = this.recognized.filter(Boolean).length;
    if (found > foundBefore) this.tip(found === this.prismjack.jewels.length ? 'all-drawn' : 'jewel-drawn');
  }

  draw(key: SurfaceKey, surface: Surface): void {
    const erasing = this.prismjack.plan.get(key)?.color === surface.color && this.prismjack.plan.get(key)?.orientation === surface.orientation;
    this.change(drawSurface(this.prismjack, key, surface));
    this.deps.sound.play(erasing ? 'erase' : 'draw');
    this.tip('first-draw');
  }

  markEmpty(cell: number, empty: boolean): void {
    if (this.prismjack.emptyCells.has(cell) === empty) return;
    this.change(markEmpty(this.prismjack, cell, empty));
    this.deps.sound.play('tick');
  }

  undo(): void {
    ({ history: this.history, state: this.prismjack } = undo(this.history, this.prismjack));
  }

  redo(): void {
    ({ history: this.history, state: this.prismjack } = redo(this.history, this.prismjack));
  }

  requestClear(): void {
    if (this.prismjack.plan.size || this.prismjack.emptyCells.size) this.dialog = 'confirm-clear';
  }

  clear(): void {
    this.change(clearPlan(this.prismjack));
    this.speech = { kind: 'cleared' };
    this.dialog = 'none';
  }

  pickColor(color: JewelColor): void {
    this.color = color;
    this.tool = 'trace';
  }

  // ---------- the prismjack itself ----------

  get missing(): number {
    return missingJewels(this.prismjack);
  }

  requestSubmit(): void {
    if (this.over || this.dive !== 'none') return;
    if (this.prismjack.plan.size > 0 && this.missing > 0) this.dialog = 'confirm-go';
    else void this.submit();
  }

  async submit(): Promise<void> {
    this.dialog = 'none';
    const outcome = submitPlan(this.prismjack);
    if (outcome.kind === 'empty-plan') {
      this.speech = { kind: 'empty-plan' };
      return;
    }
    // On phones the thief waits out of sight: he first comes down into view and pauses.
    const hidden = typeof matchMedia === 'function' && matchMedia(PHONE_PORTRAIT).matches;
    if (hidden) {
      this.dive = 'enter';
      await wait(ENTER_MS + PAUSE_MS);
    }
    // The thief drops through the roof; the verdict falls once he is out of sight.
    this.dive = 'down';
    await wait(hidden ? PHONE_DIVE_MS : DIVE_MS);
    this.prismjack = outcome.state;
    this.mood = outcome.kind === 'success' ? 'happy' : 'sad';
    this.dive = outcome.kind === 'success' ? 'escape' : 'up';
    if (outcome.kind === 'alarm') this.alarmRang();
    else if (outcome.kind === 'caught') this.caught();
    else await this.success(outcome.alarms);
    await wait(RISE_MS);
    if (this.dive === 'up') this.dive = 'none';
    setTimeout(() => (this.mood = 'calm'), MOOD_MS);
  }

  private alarmRang(): void {
    this.speech = { kind: 'alarm', level: this.alarms };
    this.alarmTick++;
    this.deps.sound.play('alarm');
    this.deps.haptics.failure();
  }

  private caught(): void {
    this.selected = null;
    this.speech = { kind: 'caught' };
    this.alarmTick++;
    this.deps.sound.play('caught');
    this.deps.haptics.failure();
    void recordCaught(this.deps.progress, this.mode).then((p) => (this.progress = p));
    this.revealAll(() => (this.dialog = 'caught'));
  }

  private async success(level: number): Promise<void> {
    this.selected = null;
    this.speech = { kind: 'success' };
    this.result = { alarms: level };
    this.deps.sound.play('success');
    this.deps.haptics.success();
    this.progress = await recordPrismjack(this.deps.progress, level, this.mode);
    this.revealAll(() => (this.dialog = 'win'));
  }

  /** Reveals the jewels one by one, then runs `done`. */
  private revealAll(done: () => void): void {
    this.revealed = 0;
    const step = () => {
      this.revealed++;
      if (this.revealed < this.prismjack.jewels.length) setTimeout(step, REVEAL_STEP_MS);
      else setTimeout(done, REVEAL_STEP_MS * 2);
    };
    setTimeout(step, REVEAL_STEP_MS);
  }

  shareText(): string {
    const level = this.result?.alarms ?? 0;
    const lamps = '🚨'.repeat(level) + '⚪'.repeat(3 - level);
    const label = this.s.shareLabel(this.mode.kind === 'daily' ? this.mode.day.split('-').reverse().join('/') : null);
    return this.s.shareText(label, lamps, this.tests, level);
  }

  // ---------- settings & tips ----------

  /** Leaving the welcome card also confirms the language shown, so it is not asked again. */
  /** True while the help is shown as the first-launch tutorial (it then ends on "train" or "play"). */
  tutorial = $state(false);

  async closeWelcome(tutorial: boolean): Promise<void> {
    if (this.settings.language === undefined) await this.updateSettings({ language: this.language });
    this.tutorial = tutorial;
    this.dialog = tutorial ? 'help' : 'none';
  }

  /** End of the first-launch tutorial: a training room, or straight to the prismjack already set up. */
  endTutorial(train: boolean): void {
    this.tutorial = false;
    if (train) this.start({ kind: 'training', level: 1 });
    else this.dialog = 'none';
  }

  async updateSettings(change: Partial<Settings>): Promise<void> {
    const settings = { ...this.settings, ...change };
    this.progress = { ...this.progress, settings };
    this.deps.sound.setEnabled(settings.sound);
    this.progress = await saveSettings(this.deps.progress, settings);
  }

  /** Wipes the progress and starts over from today's prismjack. */
  async resetProgress(): Promise<void> {
    this.progress = await resetProgress(this.deps.progress);
    this.deps.sound.setEnabled(this.settings.sound);
    this.tipsShown = [];
    this.start(this.firstMode());
    // Exactly like a first launch: the welcome card, with the language choice.
    this.dialog = 'welcome';
  }

  /** A training tip, given once per room (null outside training or if already given). */
  private takeTip(event: TipEvent): string | null {
    if (this.mode.kind !== 'training' || this.tipsShown.includes(event)) return null;
    this.tipsShown.push(event);
    return tipText(event, this.mode.level, this.s);
  }

  private tip(event: TipEvent): void {
    const text = this.takeTip(event);
    if (text) this.speech = { kind: 'tip', text };
  }
}
