import { renderShareCard, type ShareCard } from './shareCard';
import type { ShareOutcome, Sharer } from '../ports/Sharer';
import {
  alarms, eraseAt, startMode, testsLimit, testsUsed, untilNextDay, clearPlan, dayOf, drawSurface, EMPTY_HISTORY, fireLaser, LEVEL_COUNT, markEmpty,
  betterResult, LESSON_COUNT, LESSONS, missingJewels, recordCaught, restoreRun, roomFor, runQuietRatio, saveRun, snapshotRun, startRoom, recordPrismjack, resetProgress, redo, remember, saveSettings, shotAt, submitPlan, undo, unlockedLevels,
  type Lesson, type LessonStep, type PrismjackMode, type PrismjackState, type PlanHistory, type RoomPick, type Shot,
} from '../application';
import { colorsIn, JEWEL_COLORS, portSide, recognizedJewels, type BoardSize, type JewelColor, type PortId, type Surface, type SurfaceKey } from '../domain';
import type { Haptics } from '../ports/Haptics';
import { NO_PROGRESS, type LevelResult, type Progress, type ProgressStore, type Settings } from '../ports/ProgressStore';
import type { RandomSource } from '../ports/RandomSource';
import type { Sound } from '../ports/Sound';
import type { Tool } from './presenters/boardGeometry';
import type { Speech } from './presenters/messages';
import { stringsFor, type Language, type Strings } from './i18n/strings';
import { tipText, type TipEvent } from './presenters/tips';

/** First level with the tiniest jewels (index): it says so. */
const TINY_JEWELS_LEVEL = 30;
const SHARE_URL = 'https://bdyment.com/prismjack/';
const COLOR_EMOJI: Record<JewelColor, string> = { red: '🟥', blue: '🟦', yellow: '🟨', white: '⬜' };

/** True when the light came out right across from where it went in (same row or column). */
function crossesStraight(board: BoardSize, entry: PortId, exit: PortId): boolean {
  const a = portSide(board, entry), b = portSide(board, exit);
  const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;
  return opposite[a.side] === b.side && a.index === b.index;
}

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
  /** The heist just won; for a campaign level, its best result before this one and whether this one beats it. */
  result = $state.raw<{ alarms: number; best?: LevelResult; record?: boolean } | null>(null);
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
    this.watchRun();
    if (typeof window !== 'undefined') {
      const tick = () => (this.now = Date.now());
      setInterval(tick, 30_000);
      document.addEventListener('visibilitychange', tick);
    }
  }

  /** The app opens on the home menu (after the welcome card on a first launch). */
  async init(): Promise<void> {
    this.progress = await this.deps.progress.load();
    this.deps.sound.setEnabled(this.settings.sound);
    this.deps.haptics.setEnabled(this.settings.haptics ?? true);
    this.screen = 'home';
    if (this.settings.language === undefined) this.dialog = 'welcome';
  }

  /** Campaign levels that can be played (the next one after the highest won is open). */
  get unlocked(): number {
    return unlockedLevels(this.progress, LEVEL_COUNT);
  }

  goHome(): void {
    // Leaving the room ends it on screen: a GO still running settles in the background (see submit).
    this.session++;
    this.screen = 'home';
    this.dialog = 'none';
  }

  showLevels(): void {
    this.session++;
    this.screen = 'levels';
    this.dialog = 'none';
  }

  /** Ticks every 30 s and when the app comes back: the daily heist opens at midnight without a restart. */
  private now = $state(0);

  private today(): string {
    void this.now;
    return dayOf(this.deps.today());
  }

  /**
   * The daily prismjack is one attempt a day, won or caught. A day already passed counts as played too:
   * flying west after playing must not open yesterday's heist again.
   */
  get dailyDone(): boolean {
    return (this.progress.lastDailyPlayed ?? '') >= this.today();
  }

  /** "7 h 12" before the next daily prismjack. */
  nextDailyIn(): string {
    void this.now;
    const { hours, minutes } = untilNextDay(this.deps.today());
    return this.s.duration(hours, minutes);
  }

  // ---------- prismjacks ----------

  /** The room of the run being played (kept to save the run as it goes). */
  private runPick: RoomPick | null = null;

  /** Bumped by every new room: async work started for an older room (GO, reveal) must not touch this one. */
  private session = 0;

  start(mode: PrismjackMode, resumed?: { pick: RoomPick; state: PrismjackState }): void {
    this.session++;
    this.mode = mode;
    this.screen = 'game';
    if (mode.kind === 'run') {
      this.runPick = resumed?.pick ?? roomFor(mode, this.deps.randomFor(null).next());
      this.prismjack = resumed?.state ?? startRoom(this.runPick, runQuietRatio(mode.step));
    } else {
      this.runPick = null;
      this.prismjack = startMode(mode, this.deps.randomFor(null));
    }
    this.history = EMPTY_HISTORY;
    this.selected = null;
    this.flashed = null;
    this.result = null;
    this.revealed = 0;
    this.dive = 'none';
    this.mood = 'calm';
    this.dialog = 'none';
    this.tipsShown = [];
    this.lessonStep = 0;
    this.nudged = false;
    this.coachNote = null;
    this.speech = { kind: 'tip', text: this.introText(mode) };
  }

  // ---------- the playable tutorial ----------

  /** Step reached in the current lesson (see application/lessons). */
  lessonStep = $state(0);
  /** The player did something else than what the lesson asks: say so once. */
  nudged = $state(false);

  get lesson(): Lesson | null {
    return this.mode.kind === 'lesson' ? (LESSONS[this.mode.index] ?? null) : null;
  }

  /** What the current lesson step waits for (null outside the tutorial). */
  get lessonExpects(): LessonStep | null {
    return this.lesson?.steps[this.lessonStep] ?? null;
  }

  /** The coach's line for the current step. */
  get coachText(): string {
    if (this.mode.kind !== 'lesson') return '';
    if (this.prismjack.status === 'success') {
      return this.mode.index + 1 < LESSON_COUNT ? this.s.lessonWon(this.continueLabel) : this.s.tutorialDone(this.continueLabel);
    }
    return this.lessonLines(this.mode.index)[this.lessonStep] ?? '';
  }

  /** Touch screens draw with a press-and-slide gesture (preview in a loupe): the first lessons say so. */
  readonly touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

  /**
   * The lesson's lines as shown on this device: on a touch screen, the first two drawing steps also say
   * how to aim (press and hold: a loupe previews the line, slide, let go).
   */
  private lessonLines(index: number): readonly string[] {
    const lines = this.s.lessons[index] ?? [];
    if (!this.touch) return lines;
    const lesson = LESSONS[index];
    const touchLine = this.s.lessonDrawTouch[index];
    if (!lesson || !touchLine) return lines;
    return lines.map((line, i) => (lesson.steps[i]?.kind === 'draw' ? touchLine : line));
  }

  /** Feedback the coach adds under its line: a wrong plan, a GO with nothing drawn (cleared by the next gesture). */
  coachNote = $state<string | null>(null);

  /** Every line the current lesson can show, so the card keeps the height of the longest one. */
  get coachLines(): readonly string[] {
    if (this.mode.kind !== 'lesson') return [];
    const won = this.mode.index + 1 < LESSON_COUNT ? this.s.lessonWon(this.continueLabel) : this.s.tutorialDone(this.continueLabel);
    return [...this.lessonLines(this.mode.index), won];
  }

  /** The torch the lesson points at, pulsing on the board. */
  get coachPort(): PortId | null {
    const e = this.lessonExpects;
    return e?.kind === 'fire' ? e.port : null;
  }

  /** Dotted outline of the jewels while the lesson asks to draw them. */
  get coachGhost(): boolean {
    return !!this.lesson?.ghost && this.lessonExpects?.kind === 'draw';
  }

  private advanceLesson(): void {
    this.lessonStep++;
    this.nudged = false;
    // Jewels already drawn before the lesson asked for them: no need to wait.
    if (this.lessonExpects?.kind === 'draw' && this.recognized.every(Boolean)) this.lessonStep++;
  }

  /** The tutorial button: the next lesson not done yet, or the first one again once all are done. */
  startTutorial(): void {
    const reached = this.progress.lessonReached ?? 0;
    this.startLesson(reached < LESSON_COUNT ? reached : 0);
  }

  startLesson(index = 0): void {
    this.dialog = 'none';
    this.start({ kind: 'lesson', index });
  }

  /** What the thief says when a room opens: the level's lesson, today's heist, the run's progress. */
  private introText(mode: PrismjackMode): string {
    const s = this.s;
    if (mode.kind === 'level') return s.levelIntro[mode.index] ?? (mode.index === TINY_JEWELS_LEVEL ? s.tinyJewelsIntro : s.levelGeneric(mode.index + 1));
    if (mode.kind === 'daily') return s.dailyIntro;
    if (mode.kind === 'lesson') return s.lessons[mode.index]?.[0] ?? '';
    return s.runIntro(mode.step + 1);
  }

  startLevel(index: number): void {
    if (index < this.unlocked) this.start({ kind: 'level', index });
  }

  startDaily(): void {
    if (!this.dailyDone) this.start({ kind: 'daily', day: this.today() });
  }

  /** A run left unfinished is picked up where it was (same room, same tests, same drawing). */
  startRun(): void {
    const saved = this.progress.run;
    if (!saved) {
      this.start({ kind: 'run', step: 0 });
      return;
    }
    // A saved run that cannot be replayed (an older or damaged save) is dropped, never a dead end.
    const restored = this.tryRestore(saved);
    if (restored === 'broken') {
      void saveRun(this.deps.progress, null).then((p) => (this.progress = p));
      this.start({ kind: 'run', step: 0 });
    } else this.start({ kind: 'run', step: saved.step }, restored ?? undefined);
  }

  private tryRestore(saved: NonNullable<Progress['run']>): ReturnType<typeof restoreRun> | 'broken' {
    try {
      return restoreRun(saved);
    } catch {
      return 'broken';
    }
  }

  private saveTimer: ReturnType<typeof setTimeout> | undefined;

  /** Saves the run in progress shortly after every change (torch, drawing…), never once it is over. */
  private watchRun(): void {
    $effect.root(() => {
      $effect(() => {
        const state = this.prismjack, mode = this.mode, pick = this.runPick;
        clearTimeout(this.saveTimer);
        if (mode.kind !== 'run' || !pick || state.status !== 'planning') return;
        this.saveTimer = setTimeout(() => {
          void saveRun(this.deps.progress, snapshotRun(mode.step, pick, state)).then((p) => (this.progress = p));
        }, 400);
      });
    });
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
    if (m.kind === 'lesson') return m.index + 1 < LESSON_COUNT ? s.nextLesson : s.firstLevel;
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
    else if (m.kind === 'lesson') {
      if (m.index + 1 < LESSON_COUNT) this.start({ kind: 'lesson', index: m.index + 1 });
      else this.start({ kind: 'level', index: 0 });
    } else this.goHome();
  }

  // ---------- laser tests ----------

  /** Haptic tick while the finger slides from one drawing target to another. */
  feel(): void {
    this.deps.haptics.tick();
  }

  fire(port: PortId): void {
    // No test during GO: the verdict would wipe it, a free look at the room.
    if (this.over || this.dive !== 'none') return;
    const expects = this.lessonExpects;
    if (this.lessonRefuses(expects, port)) {
      this.nudged = true;
      return;
    }
    if (!shotAt(this.prismjack, port) && Date.now() - this.lastFire < DOUBLE_TAP_MS) return;
    const { state, shot, isNew } = fireLaser(this.prismjack, port);
    this.prismjack = state;
    this.coachNote = null;
    this.selected = shot;
    const number = this.prismjack.shots.indexOf(shot) + 1;
    this.speech = { kind: 'shot', number, shot };
    if (isNew) this.afterNewShot(shot, number, expects);
  }

  /** In a lesson, only the torch the coach points at (outside free play). */
  private lessonRefuses(expects: LessonStep | null, port: PortId): boolean {
    return !!expects && expects.kind !== 'free' && !(expects.kind === 'fire' && expects.port === port);
  }

  private afterNewShot(shot: Shot, number: number, expects: LessonStep | null): void {
    this.lastFire = Date.now();
    this.flashed = shot;
    this.deps.sound.play('laser');
    this.deps.haptics.tap();
    if (expects?.kind === 'fire') this.advanceLesson();
    const tip = this.mode.kind === 'lesson' ? null : this.tipAfterShot(shot);
    if (tip) this.speech = { kind: 'shot', number, shot, tip };
    if (this.prismjack.status === 'caught') this.caught();
  }

  private tipAfterShot(shot: Shot): string | null {
    const straight = shot.exit !== shot.entry && crossesStraight(this.prismjack.puzzle.board, shot.entry, shot.exit);
    const plain = shot.color ? this.takeTip('colored') : straight ? this.takeTip('transparent') : null;
    return this.takeTip('first-shot') ?? (shot.exit === shot.entry ? this.takeTip('back') : null) ?? plain;
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
    this.afterPlanChange();
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
    this.afterPlanChange();
  }

  redo(): void {
    ({ history: this.history, state: this.prismjack } = redo(this.history, this.prismjack));
    this.afterPlanChange();
  }

  /** A lesson waiting for the drawing moves on as soon as every jewel is drawn, however it got there. */
  private afterPlanChange(): void {
    this.coachNote = null;
    if (this.lessonExpects?.kind === 'draw' && this.recognized.every(Boolean)) this.advanceLesson();
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

  /**
   * After a wrong plan, one torch the plan does not explain, circled in red: a torch already lit if there is one
   * (the player can compare), otherwise any (a free clue). Gone as soon as the drawing changes.
   */
  get hintPort(): PortId | null {
    const wrong = this.prismjack.mismatches;
    if (this.over || wrong.length === 0) return null;
    return wrong.find((p) => shotAt(this.prismjack, p)) ?? wrong[0] ?? null;
  }

  get missing(): number {
    return missingJewels(this.prismjack);
  }

  requestSubmit(): void {
    if (this.over || this.dive !== 'none') return;
    const expects = this.lessonExpects;
    if (expects && expects.kind !== 'go' && expects.kind !== 'free') {
      this.nudged = true;
      return;
    }
    if (this.prismjack.plan.size > 0 && this.missing > 0) this.dialog = 'confirm-go';
    else void this.submit();
  }

  async submit(): Promise<void> {
    this.dialog = 'none';
    const outcome = submitPlan(this.prismjack);
    if (outcome.kind === 'empty-plan') {
      this.speech = { kind: 'empty-plan' };
      if (this.mode.kind === 'lesson') this.coachNote = this.s.lessonEmptyPlan;
      return;
    }
    // The verdict belongs to this room, whatever the player does during the animation.
    const session = this.session, mode = this.mode;
    await this.diveOut(session);
    if (session !== this.session) {
      this.settleElsewhere(outcome, mode);
      return;
    }
    await this.land(outcome);
  }

  /** The thief drops through the roof (on phones he first comes into view and pauses); the verdict falls once he is out of sight. */
  private async diveOut(session: number): Promise<void> {
    const hidden = typeof matchMedia === 'function' && matchMedia(PHONE_PORTRAIT).matches;
    if (hidden) {
      this.dive = 'enter';
      await wait(ENTER_MS + PAUSE_MS);
    }
    if (session === this.session) this.dive = 'down';
    await wait(hidden ? PHONE_DIVE_MS : DIVE_MS);
  }

  private async land(outcome: Exclude<ReturnType<typeof submitPlan>, { kind: 'empty-plan' }>): Promise<void> {
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

  /** The player left the room during GO: its result still counts (a daily heist stays played), on screen nothing changes. */
  private settleElsewhere(outcome: ReturnType<typeof submitPlan>, mode: PrismjackMode): void {
    if (outcome.kind === 'success') {
      void recordPrismjack(this.deps.progress, { alarms: outcome.alarms, tests: outcome.state.shots.length }, mode).then((p) => (this.progress = p));
    } else if (outcome.kind === 'caught') void recordCaught(this.deps.progress, mode).then((p) => (this.progress = p));
  }

  private alarmRang(): void {
    this.speech = { kind: 'alarm', level: this.alarms };
    if (this.mode.kind === 'lesson') this.coachNote = this.s.lessonWrongPlan(this.alarms);
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
    const mine = { alarms: level, tests: this.prismjack.shots.length };
    const before = this.mode.kind === 'level' ? this.progress.levelBest?.[String(this.mode.index)] : undefined;
    this.result = { alarms: level, ...(before ? { best: before, record: betterResult(mine, before) } : {}) };
    this.deps.sound.play('success');
    this.deps.haptics.success();
    const session = this.session;
    const progress = await recordPrismjack(this.deps.progress, mine, this.mode);
    this.progress = progress;
    if (session !== this.session) return;
    // A lesson needs no dialog: the coach card says it worked and the toolbar's button goes on.
    this.revealAll(() => (this.dialog = this.mode.kind === 'lesson' ? 'none' : 'win'));
  }


  /** Reveals the jewels one by one, then runs `done`. */
  private revealAll(done: () => void): void {
    this.revealed = 0;
    const session = this.session;
    const step = () => {
      if (session !== this.session) return;
      this.revealed++;
      if (this.revealed < this.prismjack.jewels.length) setTimeout(step, REVEAL_STEP_MS);
      else setTimeout(() => session === this.session && done(), REVEAL_STEP_MS * 2);
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
    // A failure stays: the dialog then shows the text to copy by hand.
    if (this.shareOutcome !== 'failed') setTimeout(() => (this.shareOutcome = null), 2500);
  }

  // ---------- settings & tips ----------

  /** Welcome card: "Tutorial" opens the playable lessons, "Play" goes straight to level 1. */
  async closeWelcome(tutorial: boolean): Promise<void> {
    if (this.settings.language === undefined) await this.updateSettings({ language: this.language });
    if (tutorial) this.startLesson(0);
    else this.start({ kind: 'level', index: 0 });
  }

  async updateSettings(change: Partial<Settings>): Promise<void> {
    const settings = { ...this.settings, ...change };
    this.progress = { ...this.progress, settings };
    this.deps.sound.setEnabled(settings.sound);
    this.deps.haptics.setEnabled(settings.haptics ?? true);
    this.progress = await saveSettings(this.deps.progress, settings);
  }

  /** Wipes the progress and starts over from today's prismjack. */
  async resetProgress(): Promise<void> {
    this.progress = await resetProgress(this.deps.progress);
    this.deps.sound.setEnabled(this.settings.sound);
    this.deps.haptics.setEnabled(true);
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
