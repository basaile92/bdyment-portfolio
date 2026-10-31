import {
  alarmLevel, alarmLimit, caughtBy, untilNextDay, clearPlan, dailySeed, dayOf, drawSurface, EMPTY_HISTORY, fireLaser, jewelsFor, markEmpty,
  missingJewels, recordCaught, recordHeist, resetProgress, redo, remember, saveSettings, shotAt, startHeist, submitPlan, undo,
  type HeistMode, type HeistState, type PlanHistory, type Shot,
} from '../application';
import { MAX_WRONG_PLANS, recognizedJewels, type JewelColor, type PortId, type Stars, type Surface, type SurfaceKey } from '../domain';
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

/** Two taps on emitters closer than this are treated as one (avoids paying a test for a slip). */
const DOUBLE_TAP_MS = 350;
const REVEAL_STEP_MS = 380;

/**
 * View-model of the game screen: holds the reactive UI state and turns user
 * gestures into use-case calls. It contains no game rule itself.
 */
export class GameController {
  // Immutable values: raw state keeps object identity and is cheaper than deep proxies.
  heist = $state.raw<HeistState>() as HeistState;
  history = $state.raw<PlanHistory>(EMPTY_HISTORY);
  mode = $state.raw<HeistMode>({ kind: 'free' });
  progress = $state.raw<Progress>(NO_PROGRESS);
  selected = $state.raw<Shot | null>(null);
  flashed = $state.raw<Shot | null>(null);
  result = $state.raw<{ stars: Stars } | null>(null);
  tool = $state<Tool>('trace');
  color = $state<JewelColor>('red');
  speech = $state<Speech>({ kind: 'intro' });
  dialog = $state<Dialog>('none');
  alarmTick = $state(0);
  /** Number of jewels revealed by the victory sequence. */
  revealed = $state(0);

  readonly alarm = $derived(alarmLevel(this.heist));
  readonly limit = $derived(alarmLimit(this.heist));
  readonly sirenOn = $derived(this.heist.wrongPlans > 0);
  readonly wrongPlans = $derived(this.heist.wrongPlans);
  readonly caughtBy = $derived(caughtBy(this.heist));
  readonly won = $derived(this.heist.status === 'success');
  readonly over = $derived(this.heist.status !== 'planning');
  readonly recognized = $derived(recognizedJewels(this.heist.puzzle.board, this.heist.plan, this.heist.jewels));
  readonly settings = $derived(this.progress.settings);
  get language(): Language {
    return this.progress.settings.language ?? this.deps.deviceLanguage;
  }

  /** Every text of the interface, in the current language. */
  get s(): Strings {
    return stringsFor(this.language);
  }

  private lastFire = 0;
  /** Plain (non-reactive) list: tips are bookkeeping, nothing renders from it. */
  private tipsShown: TipEvent[] = [];

  constructor(private readonly deps: GameDependencies) {
    this.heist = startHeist(deps.randomFor(null));
  }

  async init(): Promise<void> {
    this.progress = await this.deps.progress.load();
    this.deps.sound.setEnabled(this.settings.sound);
    this.start(this.firstMode());
    if (this.settings.language === undefined) this.dialog = 'welcome';
  }

  private firstMode(): HeistMode {
    return this.dailyDone ? { kind: 'free' } : { kind: 'daily', day: this.today() };
  }

  private today(): string {
    return dayOf(this.deps.today());
  }

  /** The daily heist is one attempt a day, won or caught. */
  get dailyDone(): boolean {
    return this.progress.lastDailyPlayed === this.today();
  }

  /** "7 h 12" before the next daily heist. */
  nextDailyIn(): string {
    const { hours, minutes } = untilNextDay(this.deps.today());
    return this.s.duration(hours, minutes);
  }

  // ---------- heists ----------

  start(mode: HeistMode): void {
    const seed = mode.kind === 'daily' ? dailySeed(mode.day) : null;
    this.mode = mode;
    this.heist = startHeist(this.deps.randomFor(seed), { jewels: jewelsFor(mode) });
    this.history = EMPTY_HISTORY;
    this.selected = null;
    this.flashed = null;
    this.result = null;
    this.revealed = 0;
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

  /** Retry the same room; the daily heist allows a single attempt, so a free one replaces it. */
  replay(): void {
    if (this.mode.kind === 'daily') this.startDaily();
    else this.start(this.mode);
  }

  readonly continueLabel = $derived(
    this.won ? (this.mode.kind === 'training' && this.mode.level < 3 ? this.s.next : this.s.nextHeist) : this.mode.kind === 'daily' ? this.s.freeHeist : this.s.retry,
  );

  /** After a finished heist: the obvious next step. */
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

  fire(port: PortId): void {
    if (this.over) return;
    const known = shotAt(this.heist, port);
    const now = Date.now();
    if (!known && now - this.lastFire < DOUBLE_TAP_MS) return;
    const { state, shot, isNew } = fireLaser(this.heist, port);
    this.heist = state;
    this.selected = shot;
    const number = this.heist.shots.indexOf(shot) + 1;
    this.speech = { kind: 'shot', number, shot };
    if (!isNew) return;
    this.lastFire = now;
    this.flashed = shot;
    this.deps.sound.play('laser');
    this.deps.haptics.tap();
    const tip = this.tipAfterShot(shot);
    if (tip) this.speech = { kind: 'shot', number, shot, tip };
    if (this.heist.status === 'caught') this.caught();
  }

  private tipAfterShot(shot: Shot): string | null {
    return this.takeTip('first-shot') ?? (shot.exit === shot.entry ? this.takeTip('back') : null) ?? this.takeTip(shot.color ? 'colored' : 'transparent');
  }

  shotAt(port: PortId): Shot | undefined {
    return shotAt(this.heist, port);
  }

  // ---------- drawing ----------

  private change(next: HeistState): void {
    const before = this.heist;
    const foundBefore = this.recognized.filter(Boolean).length;
    this.history = remember(this.history, before, next);
    this.heist = next;
    const found = this.recognized.filter(Boolean).length;
    if (found > foundBefore) this.tip(found === this.heist.jewels.length ? 'all-drawn' : 'jewel-drawn');
  }

  draw(key: SurfaceKey, surface: Surface): void {
    const erasing = this.heist.plan.get(key)?.color === surface.color && this.heist.plan.get(key)?.orientation === surface.orientation;
    this.change(drawSurface(this.heist, key, surface));
    this.deps.sound.play(erasing ? 'erase' : 'draw');
    this.tip('first-draw');
  }

  markEmpty(cell: number, empty: boolean): void {
    if (this.heist.emptyCells.has(cell) === empty) return;
    this.change(markEmpty(this.heist, cell, empty));
    this.deps.sound.play('tick');
  }

  undo(): void {
    ({ history: this.history, state: this.heist } = undo(this.history, this.heist));
  }

  redo(): void {
    ({ history: this.history, state: this.heist } = redo(this.history, this.heist));
  }

  requestClear(): void {
    if (this.heist.plan.size || this.heist.emptyCells.size) this.dialog = 'confirm-clear';
  }

  clear(): void {
    this.change(clearPlan(this.heist));
    this.speech = { kind: 'cleared' };
    this.dialog = 'none';
  }

  pickColor(color: JewelColor): void {
    this.color = color;
    this.tool = 'trace';
  }

  // ---------- the heist itself ----------

  get missing(): number {
    return missingJewels(this.heist);
  }

  requestSubmit(): void {
    if (this.over) return;
    if (this.heist.plan.size > 0 && this.missing > 0) this.dialog = 'confirm-go';
    else void this.submit();
  }

  async submit(): Promise<void> {
    this.dialog = 'none';
    const outcome = submitPlan(this.heist);
    this.heist = outcome.state;
    if (outcome.kind === 'empty-plan') this.speech = { kind: 'empty-plan' };
    else if (outcome.kind === 'alarm') this.alarmRang(outcome.mismatches.length);
    else if (outcome.kind === 'caught') this.caught();
    else await this.success(outcome.stars);
  }

  private alarmRang(mismatches: number): void {
    this.speech = { kind: 'alarm', mismatches, triesLeft: MAX_WRONG_PLANS - this.heist.wrongPlans };
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

  private async success(stars: Stars): Promise<void> {
    this.selected = null;
    this.speech = { kind: 'success' };
    this.result = { stars };
    this.deps.sound.play('success');
    this.deps.haptics.success();
    this.progress = await recordHeist(this.deps.progress, stars, this.mode);
    this.revealAll(() => (this.dialog = 'win'));
  }

  /** Reveals the jewels one by one, then runs `done`. */
  private revealAll(done: () => void): void {
    this.revealed = 0;
    const step = () => {
      this.revealed++;
      if (this.revealed < this.heist.jewels.length) setTimeout(step, REVEAL_STEP_MS);
      else setTimeout(done, REVEAL_STEP_MS * 2);
    };
    setTimeout(step, REVEAL_STEP_MS);
  }

  shareText(): string {
    const stars = this.result ? '★'.repeat(this.result.stars) + '☆'.repeat(3 - this.result.stars) : '';
    const label = this.s.shareLabel(this.mode.kind === 'daily' ? this.mode.day.split('-').reverse().join('/') : null);
    return this.s.shareText(label, stars, this.alarm, this.wrongPlans);
  }

  // ---------- settings & tips ----------

  /** Leaving the welcome card also confirms the language shown, so it is not asked again. */
  async closeWelcome(learn: boolean): Promise<void> {
    if (this.settings.language === undefined) await this.updateSettings({ language: this.language });
    if (learn) this.start({ kind: 'training', level: 1 });
    else this.dialog = 'none';
  }

  async updateSettings(change: Partial<Settings>): Promise<void> {
    const settings = { ...this.settings, ...change };
    this.progress = { ...this.progress, settings };
    this.deps.sound.setEnabled(settings.sound);
    this.progress = await saveSettings(this.deps.progress, settings);
  }

  /** Wipes the progress and starts over from today's heist. */
  async resetProgress(): Promise<void> {
    this.progress = await resetProgress(this.deps.progress);
    this.tipsShown = [];
    this.dialog = 'none';
    this.start(this.firstMode());
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
