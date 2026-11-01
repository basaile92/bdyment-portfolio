import { renderShareCard, type ShareCard } from './shareCard';
import type { ShareOutcome, Sharer } from '../ports/Sharer';
import {
  alarms, eraseAt, startMode, testsLimit, testsUsed, untilNextDay, clearPlan, dayOf, drawSurface, EMPTY_HISTORY, fireLaser, LEVEL_COUNT, markEmpty,
  missingJewels, recordCaught, recordPrismjack, resetProgress, redo, remember, saveSettings, shotAt, submitPlan, undo, unlockedLevels,
  type PrismjackMode, type PrismjackState, type PlanHistory, type Shot,
} from '../application';
import { colorsIn, JEWEL_COLORS, recognizedJewels, type JewelColor, type PortId, type Surface, type SurfaceKey } from '../domain';
import type { Haptics } from '../ports/Haptics';
import { NO_PROGRESS, type Progress, type ProgressStore, type Settings } from '../ports/ProgressStore';
import type { RandomSource } from '../ports/RandomSource';
import type { Sound } from '../ports/Sound';
import type { Tool } from './presenters/boardGeometry';
import type { Speech } from './presenters/messages';
import { stringsFor, type Language, type Strings } from './i18n/strings';
import { tipText, type TipEvent } from './presenters/tips';

const SHARE_URL = 'https://bdyment.com/prismjack/';
const COLOR_EMOJI: Record<JewelColor, string> = { red: '🟥', blue: '🟦', yellow: '🟨', white: '⬜' };

/** One square per test: its colour, ⬛ when nothing was touched, 🌈 for a mix. */
function shotEmoji(shot: Shot): string {
  const colors = colorsIn(shot.color);
  if (colors.length === 0) return '⬛';
  return colors.length > 1 ? '🌈' : COLOR_EMOJI[colors[0] ?? 'white'];
}

export interface GameDependencies {
  readonly randomFor: (seed: number | null) => RandomSource;
  readonly progress: ProgressStore;
  readonly haptics: Haptics;
  readonly sound: Sound;
  readonly sharer: Sharer;
  /** App Store page offered on the web version on an iPhone (null: nothing to offer). */
  readonly appStoreUrl: string | null;
  readonly today: () => Date;
  /** The device language, used until the player picks one. */
  readonly deviceLanguage: Language;
}

export type Dialog = 'none' | 'welcome' | 'help' | 'settings' | 'confirm-clear' | 'confirm-go' | 'win' | 'caught';

/** What fills the screen: the home menu, the level map, or a room being played. */
export type Screen = 'home' | 'levels' | 'game';

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
  mode = $state.raw<PrismjackMode>({ kind: 'level', index: 0 });
  screen = $state<Screen>('home');
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

  get appStoreUrl(): string | null {
    return this.deps.appStoreUrl;
  }

  constructor(private readonly deps: GameDependencies) {
    this.prismjack = startMode({ kind: 'level', index: 0 }, deps.randomFor(null));
  }

  /** The app opens on the home menu (after the welcome card on a first launch). */
  async init(): Promise<void> {
    this.progress = await this.deps.progress.load();
    this.deps.sound.setEnabled(this.settings.sound);
    this.screen = 'home';
    if (this.settings.language === undefined) this.dialog = 'welcome';
  }

  /** Campaign levels that can be played (the next one after the highest won is open). */
  get unlocked(): number {
    return unlockedLevels(this.progress, LEVEL_COUNT);
  }

  goHome(): void {
    this.screen = 'home';
    this.dialog = 'none';
  }

  showLevels(): void {
    this.screen = 'levels';
    this.dialog = 'none';
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
    this.mode = mode;
    this.screen = 'game';
    this.prismjack = startMode(mode, this.deps.randomFor(null));
    this.history = EMPTY_HISTORY;
    this.selected = null;
    this.flashed = null;
    this.result = null;
    this.revealed = 0;
    this.dive = 'none';
    this.mood = 'calm';
    this.dialog = 'none';
    this.tipsShown = [];
    this.speech = { kind: 'tip', text: this.introText(mode) };
  }

  /** What the thief says when a room opens: the level's lesson, today's heist, the run's progress. */
  private introText(mode: PrismjackMode): string {
    const s = this.s;
    if (mode.kind === 'level') return s.levelIntro[mode.index] ?? s.levelGeneric(mode.index + 1);
    if (mode.kind === 'daily') return s.dailyIntro;
    return s.runIntro(mode.step + 1);
  }

  startLevel(index: number): void {
    if (index < this.unlocked) this.start({ kind: 'level', index });
  }

  startDaily(): void {
    if (!this.dailyDone) this.start({ kind: 'daily', day: this.today() });
  }

  startRun(): void {
    this.start({ kind: 'run', step: 0 });
  }

  /** Retry: the same level; a new run; the daily heist allows a single attempt (back home). */
  replay(): void {
    const m = this.mode;
    if (m.kind === 'daily') this.goHome();
    else if (m.kind === 'run') this.startRun();
    else this.start(m);
  }

  readonly continueLabel = $derived.by(() => {
    const m = this.mode, s = this.s;
    if (m.kind === 'daily') return s.backHome;
    if (m.kind === 'run') return this.won ? s.nextRoom : s.newRun;
    if (!this.won) return s.retry;
    return m.index + 1 < LEVEL_COUNT ? s.nextLevel : s.backHome;
  });

  /** After a finished prismjack: the obvious next step. */
  continueAfter(): void {
    if (this.won) this.next();
    else this.replay();
  }

  next(): void {
    const m = this.mode;
    if (m.kind === 'level' && m.index + 1 < LEVEL_COUNT) this.start({ kind: 'level', index: m.index + 1 });
    else if (m.kind === 'run') this.start({ kind: 'run', step: m.step + 1 });
    else this.goHome();
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

  /** Eraser: removes what is drawn at `key` and the "empty" mark of `cell`. */
  erase(key: SurfaceKey | null, cell: number | null): void {
    const next = eraseAt(this.prismjack, key, cell);
    if (next === this.prismjack) return;
    this.change(next);
    this.deps.sound.play('erase');
  }

  /** Right click: next jewel colour (and back to drawing). */
  cycleColor(): void {
    const i = JEWEL_COLORS.indexOf(this.color);
    this.pickColor(JEWEL_COLORS[(i + 1) % JEWEL_COLORS.length] ?? 'red');
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

  /** What the share sheet sends: no spoiler, just the shape of the heist (one square per test). */
  shareText(): string {
    const s = this.s;
    if (this.mode.kind === 'run') {
      const rooms = this.mode.step;
      return [s.shareRunTitle, s.shareRun(rooms, Math.max(this.progress.runBest, rooms)), SHARE_URL].join('\n');
    }
    const day = this.mode.kind === 'daily' ? this.mode.day.split('-').reverse().join('/') : null;
    const won = this.prismjack.status === 'success';
    const level = this.result?.alarms ?? 3;
    const lines = [s.shareDailyTitle(day), this.prismjack.shots.map((shot) => shotEmoji(shot)).join('')];
    lines.push(won ? s.shareWon(this.tests, '🚨'.repeat(level) + '⚪'.repeat(3 - level)) : s.shareCaught(this.tests));
    if (won && this.mode.kind === 'daily' && this.progress.dailyStreak > 1) lines.push(s.shareStreak(this.progress.dailyStreak));
    lines.push(SHARE_URL);
    return lines.join('\n');
  }

  /** Last share result, shown on the button for a moment. */
  shareOutcome = $state<ShareOutcome | null>(null);
  /** The picture to share, drawn when the end dialog opens (preview shown in the dialog). */
  shareImage = $state.raw<{ blob: Blob; url: string } | null>(null);

  /** The picture's content: the room with the torches lit in order, never the jewels. */
  shareCard(): ShareCard {
    const s = this.s;
    const { board, pillars = [] } = this.prismjack.puzzle;
    const base = { board, pillars, shots: this.prismjack.shots, title: s.title, url: SHARE_URL.replace('https://', '') };
    if (this.mode.kind === 'run') {
      const rooms = this.mode.step;
      return { ...base, subtitle: s.shareRunTitle.replace(/^Prismjack · /, ''), result: s.shareCardRun(rooms), alarms: null, extra: s.shareCardBest(Math.max(this.progress.runBest, rooms)) };
    }
    const day = this.mode.kind === 'daily' ? this.mode.day.split('-').reverse().join('/') : '';
    const won = this.prismjack.status === 'success';
    const streak = won && this.progress.dailyStreak > 1 ? s.shareStreak(this.progress.dailyStreak).replace('🔥 ', '') : '';
    return {
      ...base, subtitle: s.shareDailyTitle(day).replace(/^Prismjack · /, ''),
      result: won ? s.shareCardWon(this.tests) : s.shareCardCaught(this.tests),
      alarms: won ? (this.result?.alarms ?? 0) : 3, extra: streak,
    };
  }

  async prepareShareImage(): Promise<void> {
    if (this.shareImage) URL.revokeObjectURL(this.shareImage.url);
    this.shareImage = null;
    try {
      const blob = await renderShareCard(this.shareCard());
      this.shareImage = { blob, url: URL.createObjectURL(blob) };
    } catch {
      this.shareImage = null; // the text alone is still shared
    }
  }

  async shareResult(): Promise<void> {
    this.shareOutcome = await this.deps.sharer.share(this.shareText(), this.shareImage?.blob);
    setTimeout(() => (this.shareOutcome = null), 2500);
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
  /** End of the tutorial: straight into level 1, or back to the home menu. */
  endTutorial(play: boolean): void {
    this.tutorial = false;
    if (play) this.startLevel(0);
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
    this.screen = 'home';
    // Exactly like a first launch: the welcome card, with the language choice.
    this.dialog = 'welcome';
  }

  /** A training tip, given once per room (null outside training or if already given). */
  private takeTip(event: TipEvent): string | null {
    // The thief only coaches during the first three levels.
    if (this.mode.kind !== 'level' || this.mode.index > 2 || this.tipsShown.includes(event)) return null;
    this.tipsShown.push(event);
    return tipText(event, this.s);
  }

  private tip(event: TipEvent): void {
    const text = this.takeTip(event);
    if (text) this.speech = { kind: 'tip', text };
  }
}
