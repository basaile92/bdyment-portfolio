<script lang="ts">
  import { LEVEL_COUNT } from '../../application';
  import { SHAPES } from '../../domain';
  import type { GameController } from '../GameController.svelte';
  import { JEWEL_HEX } from '../presenters/palette';
  import JewelIcon from './icons/JewelIcon.svelte';
  import Thief from './icons/Thief.svelte';
  import UiIcon from './icons/UiIcon.svelte';
  import AppBanner from './AppBanner.svelte';

  /**
   * The home menu: a night scene with the prism splitting a torch beam into the jewels' colours,
   * the three kinds of game as cards, then the tutorial and the settings.
   * One column on a phone, two (scene | cards) on a wide screen.
   */
  let { game }: { game: GameController } = $props();
  const s = $derived(game.s);
  const h = $derived(game.s.home);
  const p = $derived(game.progress);
  /** Touch screens have no hover: holding a finger on the thief lets out rope, lifting it pulls him back up. */
  let pressed = $state(false);
  const press = () => (pressed = true);
  const release = () => (pressed = false);

  const today = new Date().getDate();
  const BEAMS = [JEWEL_HEX.red, JEWEL_HEX.yellow, JEWEL_HEX.blue, JEWEL_HEX.white];
</script>

<div class="home">
  <AppBanner {game} />
  <header class="hero">
    <!-- Decorative: on a phone, pressing the thief lets out rope, like hovering with a mouse. -->
    <div class="hang" class:pressed aria-hidden="true"
      onpointerdown={press} onpointerup={release} onpointercancel={release}
      oncontextmenu={(e) => e.preventDefault()}>
      <div class="pendulum">
        <div class="rope"></div>
        <div class="thief"><Thief mood="calm" size={84} upsideDown /></div>
      </div>
    </div>
    <svg class="prism" viewBox="0 0 320 120" aria-hidden="true">
      <defs>
        <linearGradient id="in-beam" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0" /><stop offset="1" stop-color="#fff" stop-opacity=".95" /></linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f4ff" stop-opacity=".55" /><stop offset="1" stop-color="#8fb6ff" stop-opacity=".18" /></linearGradient>
      </defs>
      <path d="M0 70 L148 62" stroke="url(#in-beam)" stroke-width="4" stroke-linecap="round" />
      {#each BEAMS as c, i (c)}
        <path d="M170 62 L320 {28 + i * 22}" stroke={c} stroke-width="5" stroke-linecap="round" />
      {/each}
      <path d="M160 18 L196 92 L124 92 Z" fill="url(#glass)" stroke="#fff" stroke-opacity=".9" stroke-width="2.5" stroke-linejoin="round" />
    </svg>
    <h1>{s.title}</h1>
    <p class="tagline">{h.tagline}</p>
  </header>

  <nav>
    <button class="card levels" onclick={() => game.showLevels()}>
      <span class="badge"><JewelIcon cells={SHAPES.diamond.cells} color={JEWEL_HEX.yellow} cell={18} /></span>
      <span class="text">
        <strong>{h.levels}</strong>
        <small>{h.levelsSub(p.levelsWon.length, LEVEL_COUNT)}</small>
      </span>
      <span class="go" aria-hidden="true">›</span>
    </button>

    <button class="card daily" disabled={game.dailyDone} onclick={() => game.startDaily()}>
      <span class="badge"><span class="calendar"><b></b>{today}</span></span>
      <span class="text">
        <strong>{h.daily}</strong>
        <small>{game.dailyDone ? h.dailyDone(game.nextDailyIn()) : h.dailyOpen}</small>
        {#if p.dailyStreak > 0}<span class="chip">🔥 {h.streak(p.dailyStreak)}</span>{/if}
      </span>
      <span class="go" aria-hidden="true">›</span>
    </button>

    <button class="card run" onclick={() => game.startRun()}>
      <span class="badge"><span class="bars"><i></i><i></i><i></i></span></span>
      <span class="text">
        <strong>{h.run}</strong>
        <small>{p.run ? h.runResume(p.run.step + 1) : h.runSub(p.runBest)}</small>
      </span>
      <span class="go" aria-hidden="true">›</span>
    </button>

    <div class="extras">
      <button class="pill" onclick={() => game.startTutorial()}><UiIcon name="help" size={18} />{h.tutorial}</button>
      <button class="pill" onclick={() => (game.dialog = 'settings')}><UiIcon name="settings" size={18} />{h.settings}</button>
    </div>
  </nav>
</div>

<style>
  .home {
    position: fixed; inset: 0; z-index: 30; overflow-y: auto; overflow-x: hidden;
    background: radial-gradient(ellipse at 50% 0%, #26327f 0%, var(--bg) 60%);
    display: flex; flex-direction: column; align-items: center; gap: 18px;
    padding: calc(12px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));
  }

  .hero { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 84px; }
  /*
   * The thief is a pendulum hanging from a point far above: rope and body swing together, so the lower
   * he hangs, the wider his swing. Hovering him with the mouse lets out some rope (the hover area grows
   * with him so he does not bounce back up).
   */
  .hang { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 110px; height: 110px; z-index: 1; }
  .pendulum {
    --pivot: 160px; --drop: 0px;
    position: absolute; left: 50%; top: calc(-1 * var(--pivot)); width: 84px; margin-left: -42px;
    height: calc(var(--pivot) + 110px + var(--drop)); transform-origin: 50% 0;
    animation: sway 3.2s ease-in-out infinite alternate;
    transition: height 0.7s cubic-bezier(0.3, 1.4, 0.5, 1);
  }
  @keyframes sway { from { transform: rotate(-3deg); } to { transform: rotate(3deg); } }
  .rope { position: absolute; left: 50%; top: -100vh; bottom: 78px; width: 3px; background: repeating-linear-gradient(170deg, #c9a46a 0 4px, #8a6a3a 4px 7px); transform: translateX(-50%); }
  .thief { position: absolute; left: 0; bottom: 0; width: 84px; }
  .hang { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; touch-action: none; }
  .hang.pressed { height: 170px; }
  .hang.pressed .pendulum { height: calc(var(--pivot) + 110px + 56px); }
  @media (hover: hover) {
    .hang:hover { height: 170px; }
    .hang:hover .pendulum { height: calc(var(--pivot) + 110px + 56px); }
  }
  .prism { width: min(70vw, 280px); height: auto; margin-top: 14px; }
  h1 { margin: 4px 0 0; font-family: var(--title-font); font-weight: 400; font-size: clamp(40px, 9vw, 64px); letter-spacing: 1px; line-height: 1; color: var(--gold); }
  .tagline { margin: 8px 0 0; font-size: 14px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); }

  nav { width: min(100%, 440px); display: flex; flex-direction: column; gap: 10px; }
  .card {
    --accent: var(--cyan);
    display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 14px;
    padding: 12px 16px 12px 12px; text-align: left; border-radius: 18px;
    border: 2px solid var(--accent); background: var(--slot);
    transition: transform 0.12s, background-color 0.15s;
  }
  .card.daily { --accent: var(--gold); }
  .card.run { --accent: var(--orange); }
  .card:disabled { opacity: 0.55; cursor: default; }
  .badge { width: 52px; height: 52px; border-radius: 14px; display: grid; place-items: center; background: rgba(10, 14, 50, 0.6); }
  .text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .text strong { font-size: 18px; font-weight: 900; color: #fff; }
  .text small { font-size: 13px; font-weight: 700; color: var(--muted); line-height: 1.3; }
  .go { font-size: 26px; font-weight: 900; color: var(--accent); line-height: 1; }

  .calendar { width: 32px; height: 32px; border-radius: 6px; background: #fff; color: #1b1745; font-weight: 900; font-size: 14px; display: flex; flex-direction: column; align-items: center; overflow: hidden; }
  .calendar b { display: block; width: 100%; height: 8px; background: #ff5c7a; margin-bottom: 1px; }
  .chip { align-self: flex-start; font-size: 12px; font-weight: 900; color: var(--gold); }
  .bars { display: flex; align-items: flex-end; gap: 4px; height: 28px; }
  .bars i { width: 7px; border-radius: 2px; background: var(--orange); }
  .bars i:nth-child(1) { height: 10px; }
  .bars i:nth-child(2) { height: 18px; }
  .bars i:nth-child(3) { height: 28px; }

  .extras { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 2px; }
  .pill {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 14px; border-radius: 999px;
    font-weight: 900; font-size: 15px; color: #dbe1ff; border: 2px solid var(--edge); background: transparent;
  }

  @media (hover: hover) {
    .card:hover:not(:disabled) { transform: translateY(-2px); background: var(--slot-on); }
    .pill:hover { background: var(--slot); }
  }

  /* Tall screens (iPad held upright): the whole menu centred, not stuck to the top. */
  @media (min-width: 600px) and (min-height: 900px) {
    .home { justify-content: center; }
  }

  /* Wide screens: the title on the left, the cards on the right. */
  @media (min-width: 900px) and (min-height: 560px) {
    .home { flex-direction: row; justify-content: center; align-items: center; gap: clamp(40px, 7vw, 100px); padding: 40px; }
    .hero { padding-top: 100px; }
    .prism { width: 340px; }
    h1 { font-size: 72px; }
    nav { width: 420px; gap: 12px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .pendulum { animation: none; transition: none; }
  }
</style>
