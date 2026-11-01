<script lang="ts">
  import { JEWEL_COLORS, maskOf, SHAPES, type JewelColor } from '../../domain';
  import { PART_POLYGON, translate } from '../presenters/shapes';
  import type { GameController } from '../GameController.svelte';
  import { GLYPH, JEWEL_HEX, laserFill } from '../presenters/palette';
  import Glyph from './Glyph.svelte';
  import AlarmLamps from './AlarmLamps.svelte';
  import ToolIcon from './icons/ToolIcon.svelte';
  import Modal from './Modal.svelte';
  import Rich from './Rich.svelte';

  /** The rules, one idea per panel, each with a picture. Learning by playing happens in the training rooms. */
  let { game }: { game: GameController } = $props();
  const s = $derived(game.s);

  const MIXES: JewelColor[][] = [['red', 'blue'], ['blue', 'yellow'], ['red', 'yellow'], ['red', 'blue', 'yellow'], ['blue', 'white'], ['red', 'white'], ['yellow', 'white']];
  /** Where the five jewels sit in the Goal picture (10 × 4 cells). */
  const GOAL_LAYOUT = [
    { id: 'red', shape: SHAPES.legTriangle, color: 'red', x: 0, y: 1 },
    { id: 'blue', shape: SHAPES.smallTriangle, color: 'blue', x: 3, y: 0 },
    { id: 'diamond', shape: SHAPES.diamond, color: 'yellow', x: 3, y: 2 },
    { id: 'white', shape: SHAPES.trapezoid, color: 'white', x: 5, y: 0 },
    { id: 'big', shape: SHAPES.bigTriangle, color: 'yellow', x: 6, y: 2 },
  ].map((j) => ({ ...j, cells: j.shape.cells, color: j.color as JewelColor }));
  const PANELS = ['goal', 'test', 'walls', 'colors', 'draw', 'alarm'] as const;

  let page = $state(0);
  $effect(() => {
    if (game.dialog !== 'help') page = 0;
  });
  const last = $derived(page === PANELS.length - 1);
  const title = $derived([s.helpGoal, s.helpTest, s.helpWalls, s.helpColors, s.helpDraw, s.helpAlarm][page]);
</script>

{#snippet glyph(c: JewelColor)}
  <svg viewBox="0 0 1 1" width="14" height="14" aria-hidden="true">{#if !game.symbols}<circle cx=".5" cy=".5" r=".4" fill={JEWEL_HEX[c]} />{:else}<Glyph glyph={GLYPH[c]} x={0.5} y={0.5} size={0.95} fill={JEWEL_HEX[c]} />{/if}</svg>
{/snippet}

{#snippet torch(x: number, y: number, color?: string)}
  <circle cx={x} cy={y} r="9" fill="#a7adc7" />
  <circle cx={x} cy={y} r="7" fill={color ?? '#2c3152'} stroke="#20254a" stroke-width="1" />
  <path d="M{x - 5} {y - 2}a6 6 0 0 1 4 -4" stroke="#fff" stroke-opacity=".6" stroke-width="1.2" fill="none" stroke-linecap="round" />
{/snippet}

{#snippet glass(x: number, y: number, w: number, h: number)}
  <rect {x} {y} width={w} height={h} fill="#283586" stroke="rgba(160,225,255,.55)" stroke-width="1.5" />
  {#each Array.from({ length: Math.round(w / 20) - 1 }, (_, i) => i + 1) as i (i)}<line x1={x + i * 20} y1={y} x2={x + i * 20} y2={y + h} stroke="rgba(170,195,255,.3)" />{/each}
  {#each Array.from({ length: Math.round(h / 20) - 1 }, (_, i) => i + 1) as i (i)}<line x1={x} y1={y + i * 20} x2={x + w} y2={y + i * 20} stroke="rgba(170,195,255,.3)" />{/each}
{/snippet}

<Modal open={game.dialog === 'help'} label={s.helpTitle} onclose={() => (game.tutorial ? game.endTutorial(false) : (game.dialog = 'none'))}>
  <h2>{game.tutorial ? s.welcomeLearn : s.helpTitle}</h2>
  <div class="dots" aria-label={s.helpPage(page + 1, PANELS.length)}>
    {#each PANELS as id, i (id)}<button class:on={i === page} aria-label={s.helpPage(i + 1, PANELS.length)} onclick={() => (page = i)}></button>{/each}
  </div>
  <h3>{title}</h3>
  <div class="panel">

  {#if PANELS[page] === 'goal'}
    <svg class="pic" viewBox="0 0 220 100" aria-hidden="true">
      {@render glass(10, 10, 200, 80)}
      <!-- The real five jewels, on the grid as in a prismjack, seen faintly through the glass. -->
      <g transform="translate(10 10) scale(20)">
        {#each GOAL_LAYOUT as j (j.id)}
          <g fill={JEWEL_HEX[j.color]} fill-opacity=".45" stroke={JEWEL_HEX[j.color]} stroke-width=".07" stroke-linejoin="round">
            {#each j.cells as c (`${c.x},${c.y}`)}<polygon points={translate(PART_POLYGON[c.part], j.x + c.x, j.y + c.y)} />{/each}
          </g>
        {/each}
        {#each Array.from({ length: 40 }, (_, i) => i) as i (i)}<circle cx={(i % 10) + 0.5} cy={Math.floor(i / 10) + 0.5} r=".06" fill="#ff4d6d" opacity=".6" />{/each}
      </g>
    </svg>
    <p><Rich text={s.helpGoalText} /></p>
  {:else if PANELS[page] === 'test'}
    <svg class="pic" viewBox="0 0 220 96" aria-hidden="true">
      {@render glass(40, 18, 140, 60)}
      <rect x="40" y="38" width="38" height="20" fill="url(#help-in)" />
      <rect x="142" y="38" width="38" height="20" fill="url(#help-out)" />
      <path d="M78 48 H110 V30" stroke="#fff" stroke-dasharray="3 4" stroke-opacity=".35" fill="none" />
      <text x="110" y="62" class="q">?</text>
      {@render torch(24, 48)}
      {@render torch(196, 48, JEWEL_HEX.yellow)}
      <defs>
        <linearGradient id="help-in"><stop offset="0" stop-color="#fffbe8" stop-opacity=".9" /><stop offset="1" stop-color="#fffbe8" stop-opacity="0" /></linearGradient>
        <linearGradient id="help-out" x1="1" x2="0"><stop offset="0" stop-color={JEWEL_HEX.yellow} stop-opacity=".9" /><stop offset="1" stop-color={JEWEL_HEX.yellow} stop-opacity="0" /></linearGradient>
      </defs>
    </svg>
    <p><Rich text={s.helpTestText} /></p>
  {:else if PANELS[page] === 'walls'}
    <div class="pair">
      <figure>
        <svg class="pic small" viewBox="0 0 100 80" aria-hidden="true">
          {@render glass(10, 10, 80, 60)}
          <line x1="70" y1="20" x2="70" y2="60" stroke={JEWEL_HEX.red} stroke-width="5" stroke-linecap="round" />
          <path d="M14 34 H64" stroke="#fffbe8" stroke-width="3" marker-end="url(#arrow)" />
          <path d="M64 46 H18" stroke={JEWEL_HEX.red} stroke-width="3" marker-end="url(#arrow-red)" />
        </svg>
        <figcaption><ToolIcon kind="wall" color={JEWEL_HEX.red} size={26} /><span><Rich text={s.helpWall} /></span></figcaption>
      </figure>
      <figure>
        <svg class="pic small" viewBox="0 0 100 80" aria-hidden="true">
          {@render glass(10, 10, 80, 60)}
          <line x1="50" y1="30" x2="70" y2="50" stroke={JEWEL_HEX.red} stroke-width="5" stroke-linecap="round" />
          <path d="M14 40 H58 V64" stroke="#fffbe8" stroke-width="3" fill="none" marker-end="url(#arrow)" />
        </svg>
        <figcaption><ToolIcon kind="facet" color={JEWEL_HEX.red} size={26} /><span><Rich text={s.helpFacet} /></span></figcaption>
      </figure>
    </div>
    <svg width="0" height="0" aria-hidden="true">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#fffbe8" /></marker>
        <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill={JEWEL_HEX.red} /></marker>
      </defs>
    </svg>
  {:else if PANELS[page] === 'colors'}
    <p class="legend">{#each JEWEL_COLORS as c (c)}<span>{@render glyph(c)}{s.colors[c]}</span>{/each}</p>
    <p>{s.helpColorsText}{game.symbols ? s.helpSymbols : ''}</p>
    <div class="mixes">
      {#each MIXES as m (m.join())}
        <span class="mix">{#each m as c, i (c)}{#if i}+{/if}{@render glyph(c)}{/each} = <i style="background: {laserFill(maskOf(...m))}"></i></span>
      {/each}
    </div>
  {:else if PANELS[page] === 'draw'}
    <svg class="pic" viewBox="0 0 220 80" aria-hidden="true">
      {@render glass(20, 10, 180, 60)}
      <rect x="40" y="30" width="20" height="20" fill="none" stroke="#fff" stroke-dasharray="2 2" stroke-opacity=".5" />
      <line x1="40" y1="30" x2="60" y2="30" stroke={JEWEL_HEX.blue} stroke-width="4" stroke-linecap="round" />
      <rect x="100" y="30" width="20" height="20" fill="none" stroke="#fff" stroke-dasharray="2 2" stroke-opacity=".5" />
      <line x1="100" y1="50" x2="120" y2="30" stroke={JEWEL_HEX.yellow} stroke-width="4" stroke-linecap="round" />
      <path d="M164 34l12 12M176 34l-12 12" stroke="#8f9bd6" stroke-width="3" stroke-linecap="round" />
    </svg>
    <div class="tools-row">
      <span><ToolIcon kind="trace" color={JEWEL_HEX.red} size={26} />{s.trace}</span>
      <span><ToolIcon kind="empty" color="" size={26} />{s.empty}</span>
    </div>
    <p><Rich text={s.helpDrawText} /></p>
  {:else}
    <div class="alarm-pic">
      <svg class="pic" viewBox="0 0 220 44" aria-hidden="true">
        <rect x="10" y="14" width="200" height="10" rx="5" fill="#0b0f30" />
        <rect x="10" y="14" width="90" height="10" rx="5" fill="#3ee0a1" />
        <rect x="132" y="8" width="2" height="22" fill="#fff" />
        <text x="133" y="42" class="mark-label">+1</text>
      </svg>
      <div class="levels">
        {#each [0, 1, 2, 3] as n (n)}<span><AlarmLamps level={n} size={18} label={s.alarmLevel(n)} /><small>{n}/3</small></span>{/each}
      </div>
    </div>
    <p>{s.helpAlarmText}</p>
  {/if}
  </div>

  <div class="row nav">
    {#if page > 0}<button class="btn" onclick={() => page--}>{s.previous}</button>{/if}
    {#if last && game.tutorial}
      <button class="btn" onclick={() => game.endTutorial(true)}>{s.tutorialTrain}</button>
      <button class="btn primary" onclick={() => game.endTutorial(false)}>{s.tutorialPlay}</button>
    {:else if last}
      <button class="btn primary" onclick={() => (game.dialog = 'none')}>{s.gotIt}</button>
    {:else}
      <button class="btn primary" onclick={() => page++}>{s.next2}</button>
    {/if}
  </div>
</Modal>

<style>
  h3 { margin: 0; font-size: 17px; font-weight: 900; color: #fff; text-align: center; }
  .dots { display: flex; justify-content: center; gap: 8px; }
  .dots button { width: 10px; height: 10px; padding: 0; border-radius: 5px; border: none; background: var(--edge); transition: width 0.2s; }
  .dots button.on { width: 26px; background: var(--gold); }
  .pic { width: 100%; height: auto; display: block; border-radius: 10px; background: #1c2160; }
  .pic.small { background: none; }
  .q { font-size: 14px; font-weight: 900; fill: #fff; fill-opacity: 0.5; text-anchor: middle; }
  .mark-label { font-size: 11px; font-weight: 900; fill: #ff6b85; text-anchor: middle; }
  .alarm-pic { display: flex; flex-direction: column; gap: 8px; }
  .levels { display: flex; justify-content: space-around; }
  .levels span { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .levels small { font-size: 12px; font-weight: 900; color: var(--muted); }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  figure { margin: 0; display: flex; flex-direction: column; gap: 6px; }
  figcaption { display: flex; gap: 6px; align-items: flex-start; font-size: 13.5px; line-height: 1.4; color: #dbe1ff; }
  figcaption :global(svg) { flex: none; }
  .tools-row { display: flex; justify-content: center; gap: 18px; font-weight: 900; }
  .tools-row span { display: inline-flex; align-items: center; gap: 6px; }
  .legend { display: flex; gap: 14px; flex-wrap: wrap; font-weight: 800; justify-content: center; }
  .legend span { display: inline-flex; align-items: center; gap: 4px; }
  .mixes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 10px; font-size: 13px; font-weight: 800; color: #dbe1ff; }
  .mix { display: flex; align-items: center; gap: 3px; white-space: nowrap; }
  .mix i { width: 18px; height: 18px; border-radius: 50%; flex: none; border: 1.5px solid rgba(255, 255, 255, 0.5); }
  /* Same height on every page, so the buttons don't jump while browsing. */
  .panel { min-height: 300px; display: flex; flex-direction: column; gap: 10px; }
  .nav { margin-top: 4px; }
  :global(b) { color: #fff; }
</style>
