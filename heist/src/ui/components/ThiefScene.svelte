<script lang="ts">
  import Rich from './Rich.svelte';
  import type { GameController } from '../GameController.svelte';
  import { speak } from '../presenters/messages';
  import Thief from './icons/Thief.svelte';

  let { game }: { game: GameController } = $props();

  const parts = $derived(speak(game.speech, game.s));
  const t = $derived(game.heist.thresholds);
  const pct = (n: number) => `${Math.min(100, (n / game.limit) * 100)}%`;

  /** The rope always reaches the header, wherever the layout puts the thief. */
  let thief = $state<HTMLElement>();
  let rope = $state(0);

  function measure() {
    const header = document.querySelector('header');
    if (!thief || !header) return;
    rope = Math.max(0, thief.getBoundingClientRect().top - header.getBoundingClientRect().bottom);
  }

  $effect(() => {
    measure();
    // The thief moves when the room or the side column resizes, and when fonts arrive.
    const observer = new ResizeObserver(measure);
    for (const el of document.querySelectorAll('main, main > *, header')) observer.observe(el);
    void document.fonts?.ready.then(measure);
    requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  });
</script>

<section class="scene">
  <div class="top">
    {#key game.alarmTick}
      <div class="thief" class:wiggle={game.alarmTick > 0} bind:this={thief}>
        <div class="rope" style="height: {rope + 14}px" aria-hidden="true"></div>
        <Thief upsideDown size={60} />
      </div>
    {/key}
    <p class="bubble" aria-live="polite">
      {#each parts as part, i (i)}{#if part.swatch}<span class="swatch" style="background: {part.swatch}"></span>{/if}<span
          class:strong={part.strong} class:good={part.tone === 'good'} class:bad={part.tone === 'bad'}>{part.text}</span>{/each}
    </p>
  </div>
  <div class="alarm" class:on={game.sirenOn} role="meter" aria-valuemin="0" aria-valuemax={game.limit} aria-valuenow={game.alarm} aria-label={game.s.gaugeLabel}>
    <svg viewBox="0 0 44 44" width="30" height="30" aria-hidden="true">
      <circle class="glow" cx="22" cy="20" r="20" fill="#ff3b5c" opacity=".3" />
      <path d="M10 34V22a12 12 0 0124 0v12z" fill="#ff3b5c" /><rect x="6" y="34" width="32" height="6" rx="2" fill="#3a3a48" />
    </svg>
    <div class="gauge">
      <div class="track"><div class="fill" style="width: {pct(game.alarm)}"></div><div class="mark" style="left: {pct(t.threeStars)}"></div></div>
      <div class="legend">
        <span><Rich text={game.s.tests(game.alarm)} /></span>
        <span title={game.s.starsHint}><span class="stars">{#each [0, 1, 2] as i (i)}<span class:lost={i >= 3 - game.wrongPlans}>★</span>{/each}</span> {game.s.threeStarsUpTo(t.threeStars)}</span>
        <span class:bad={game.wrongPlans > 0}>{game.s.wrongPlans(game.wrongPlans)}</span>
      </div>
    </div>
  </div>
</section>

<style>
  .scene { display: flex; flex-direction: column; gap: 6px; padding: 4px 12px 0; }
  .top { position: relative; display: flex; gap: 12px; align-items: flex-start; min-height: 66px; }
  .thief { flex: none; width: 60px; margin-left: 20px; }
  .thief { position: relative; }
  /* Twisted strands: diagonal stripes in three tones, shaded edges for roundness. */
  .rope {
    position: absolute; left: calc(50% - 2.5px); bottom: calc(100% - 14px); width: 5px; border-radius: 2px;
    background:
      linear-gradient(90deg, rgba(40, 24, 8, 0.45), transparent 35%, rgba(255, 245, 220, 0.25) 50%, transparent 65%, rgba(40, 24, 8, 0.5)),
      repeating-linear-gradient(-58deg, #e6d3a6 0 2px, #c9a86f 2px 3.5px, #a8854f 3.5px 4.5px, #d8bf8a 4.5px 6px);
  }
  .rope::before {
    content: ''; position: absolute; left: -3.5px; top: 0; width: 12px; height: 6px; border-radius: 0 0 3px 3px;
    background: linear-gradient(180deg, #8a6a3c, #5e4524); box-shadow: inset 0 -1px 0 rgba(255, 240, 210, 0.25);
  }
  .wiggle { animation: wiggle 0.5s 2; transform-origin: 50% 0; }
  @keyframes wiggle { 25% { transform: rotate(-12deg); } 75% { transform: rotate(12deg); } }
  .bubble {
    position: relative; flex: 1; margin: 8px 0 0 6px; min-height: 48px; background: #fff; color: #1b1745;
    border-radius: 14px; padding: 7px 11px; font-size: 14px; line-height: 1.3; font-weight: 800;
  }
  .bubble::before { content: ''; position: absolute; left: -8px; top: 16px; border: 8px solid transparent; border-right-color: #fff; border-left: 0; }
  .strong { font-weight: 900; }
  .good { color: #12805a; }
  .bad { color: #c81e45; }
  .swatch { display: inline-block; width: 11px; height: 11px; border-radius: 50%; border: 1px solid #1b1745; margin-right: 3px; vertical-align: -1px; }
  .alarm { display: flex; align-items: center; gap: 8px; }
  .gauge { flex: 1; display: flex; flex-direction: column; gap: 3px; }
  .track { position: relative; height: 10px; border-radius: 5px; background: #0b0f30; overflow: visible; }
  .fill { position: absolute; inset: 0 auto 0 0; border-radius: 5px; background: linear-gradient(90deg, #3ee0a1, var(--gold) 55%, #ff3b5c); background-size: 300px 100%; transition: width 0.3s; }
  .mark { position: absolute; top: -3px; bottom: -3px; width: 2px; background: #fff; }
  .legend { display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; color: var(--muted); }
  .legend :global(b) { color: var(--ink); }
  .legend .bad { color: #ff6b85; }
  .stars { color: var(--gold); letter-spacing: 1px; }
  .stars .lost { color: #ff3b5c; opacity: 0.45; text-decoration: line-through; }
  .glow { opacity: 0; transition: opacity 0.3s; }
  .alarm.on .glow { opacity: 1; animation: pulse 1s infinite; }
  @keyframes pulse { 50% { opacity: 0.35; } }
</style>
