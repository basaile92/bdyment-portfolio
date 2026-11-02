<script lang="ts">
  import AlarmLamps from './AlarmLamps.svelte';
  import type { GameController } from '../GameController.svelte';
  import { speak } from '../presenters/messages';
  import Thief from './icons/Thief.svelte';

  let { game }: { game: GameController } = $props();

  const parts = $derived(speak(game.speech, game.s));
  const t = $derived(game.prismjack.thresholds);
  /**
   * The mark sits at a fixed spot: the bar up to it holds exactly the quiet tests, so « 4 / 11 » fills 4/11 of it.
   * Past the mark the red zone fills at once and stays full: it costs one alarm level, once, never more per test.
   */
  const MARK = 80;
  const pct = (n: number) => (n <= t.quiet ? `${(n / Math.max(1, t.quiet)) * MARK}%` : '100%');

  /** PC: hovering the thief fades his bubble out quickly; it fades back in when the mouse leaves. */
  let bubbleGone = $state(false);
  function setHidden(hidden: boolean) {
    if (matchMedia('(hover: hover)').matches) bubbleGone = hidden;
  }

  /** The rope always reaches the header, wherever the layout puts the thief. */
  let thief = $state<HTMLElement>();
  let rope = $state(0);
  /** Extra rope hidden behind the header, paid out when the thief drops a little on hover. */
  const SLACK = 24;

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
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="thief" class:diving={game.dive === 'down'} class:rising={game.dive === 'up'} class:escaping={game.dive === 'escape'}
      bind:this={thief} onmouseenter={() => setHidden(true)} onmouseleave={() => setHidden(false)}>
      <div class="rope" style="height: max(0px, calc({rope + 14 + SLACK}px + var(--drop, 0px)))" aria-hidden="true"></div>
      {#key game.alarmTick}
        <div class="body" class:wiggle={game.alarmTick > 0}><Thief upsideDown size={60} mood={game.mood} /></div>
      {/key}
    </div>
    <div class="bubble-slot">
      <!-- In a lesson the coach card speaks: the bubble would only repeat it. -->
      <p class="bubble" class:gone={bubbleGone || game.mode.kind === 'lesson'} aria-live={game.mode.kind === 'lesson' ? 'off' : 'polite'}>
        {#each parts as part, i (i)}{#if part.swatch}<span class="swatch" style="background: {part.swatch}"></span>{/if}<span
            class:strong={part.strong} class:good={part.tone === 'good'} class:bad={part.tone === 'bad'}>{part.text}</span>{/each}
      </p>
    </div>
  </div>
  <div class="alarm" class:on={game.sirenOn} role="meter" aria-valuemin="0" aria-valuemax={game.limit} aria-valuenow={game.tests} aria-label={game.s.gaugeLabel}>
    <AlarmLamps level={game.alarms} size={20} label={game.s.alarmLevel(game.alarms)} />
    <div class="gauge" title={game.s.alarmHint}>
      <div class="track">
        <div class="danger" style="left: {MARK}%"><span>+1</span></div>
        <div class="fill" class:over={game.tests > t.quiet} style="width: {pct(game.tests)}"></div>
        <div class="mark" style="left: {MARK}%">
          <!-- Past this mark, the alarm goes up a level. -->
          <svg viewBox="0 0 20 20" width="13" height="13" aria-hidden="true"><path d="M4 15V10a6 6 0 0 1 12 0v5z" fill="#ff3b5c" /><rect x="2" y="15" width="16" height="3" rx="1" fill="#3a3a48" /></svg>
        </div>
      </div>
    </div>
    <span class="count" class:over={game.tests > t.quiet} aria-label={game.s.quietUntil(t.quiet)}>
      <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#a7adc7" /><circle cx="10" cy="10" r="6.5" fill="#2c3152" /><circle cx="10" cy="10" r="1.6" fill="#8b90a8" /></svg>
      <b>{game.tests}</b>&nbsp;/&nbsp;{t.quiet}
    </span>
  </div>
</section>

<style>
  .scene { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 4px 12px 0; }
  /* Phones only (narrow portrait): no thief or bubble, the room gets the space (messages float over it, see SpeechToast). */
  @media (max-width: 599px) and (max-aspect-ratio: 1/1) {
    .top { display: none !important; }
  }
  /* PC: hovering the thief lowers him a little on his rope (the bubble stays put), then he climbs back. */
  .thief { transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
  @media (hover: hover) {
    .thief:hover { transform: translateY(14px); }
    /* Dropping makes him nervous: the floor is alarmed. */
    .thief:hover :global(.face-calm) { opacity: 0; }
    .thief:hover :global(.face-tense) { opacity: 1; }
  }
  .top { position: relative; display: flex; gap: 12px; align-items: flex-start; min-height: 66px; }
  .thief { flex: none; width: 60px; margin-left: 20px; }
  .thief { position: relative; z-index: 6; }
  /* GO: he drops below the window on his rope (the rope pays out), then climbs back up. */
  .thief.diving, .thief.diving:hover { --drop: 110vh; transform: translateY(110vh); transition: transform 0.6s cubic-bezier(0.55, 0, 1, 0.45); }
  .thief.diving .rope { transition: height 0.6s cubic-bezier(0.55, 0, 1, 0.45); }
  /* Plan right: back up and straight out of the top of the screen with the loot. */
  .thief.escaping, .thief.escaping:hover { --drop: -110vh; transform: translateY(-110vh); transition: transform 1.1s cubic-bezier(0.3, 0, 0.6, 1); }
  .thief.escaping .rope { transition: height 1.1s cubic-bezier(0.3, 0, 0.6, 1); }
  .thief.rising { transition: transform 0.7s cubic-bezier(0.2, 0.9, 0.3, 1); }
  .thief.rising .rope { transition: height 0.7s cubic-bezier(0.2, 0.9, 0.3, 1); }
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
  .bubble-slot { flex: 1; display: flex; }
  .bubble.gone { opacity: 0; }
  .bubble { transition: opacity 0.075s; }
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
  .gauge { flex: 1; display: flex; flex-direction: column; padding-top: 12px; }
  .track { position: relative; height: 10px; border-radius: 5px; background: #0b0f30; overflow: visible; }
  .danger { position: absolute; top: 0; bottom: 0; right: 0; z-index: 1; display: flex; align-items: center; justify-content: center; border-radius: 0 5px 5px 0; background: rgba(255, 59, 92, 0.22); }
  .danger span { font-size: 8px; line-height: 1; font-weight: 900; color: #fff; opacity: 0.85; }
  .fill { position: absolute; inset: 0 auto 0 0; border-radius: 5px; background: linear-gradient(90deg, #3ee0a1, var(--gold)); transition: width 0.3s, background 0.3s; }
  .fill.over { background: linear-gradient(90deg, #3ee0a1, var(--gold) 70%, #ff3b5c); }
  .mark { position: absolute; top: -3px; bottom: -3px; width: 2px; background: #fff; }
  .mark svg { position: absolute; left: 50%; bottom: 100%; transform: translate(-50%, -1px); }
  .count { display: inline-flex; align-items: center; gap: 5px; font-size: 14px; font-weight: 800; color: var(--muted); white-space: nowrap; }
  .count b { color: var(--ink); }
  .count.over b { color: #ff6b85; }
</style>
