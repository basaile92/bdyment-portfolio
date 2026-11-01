<script lang="ts">
  import { maskOf, SHAPES, type JewelColor } from '../../domain';
  import type { GameController } from '../GameController.svelte';
  import { GLYPH, JEWEL_HEX, laserFill } from '../presenters/palette';
  import AlarmLamps from './AlarmLamps.svelte';
  import Glyph from './Glyph.svelte';
  import JewelIcon from './icons/JewelIcon.svelte';
  import Thief from './icons/Thief.svelte';
  import ToolIcon from './icons/ToolIcon.svelte';
  import Modal from './Modal.svelte';
  import Rich from './Rich.svelte';
  import TutorialScene from './TutorialScene.svelte';

  /** The tutorial: the story, then one rule per page, each illustrated by a room the real engine lights. */
  let { game }: { game: GameController } = $props();
  const s = $derived(game.s);
  const pages = $derived(s.tutorialPages);

  let page = $state(0);
  $effect(() => {
    if (game.dialog !== 'help') page = 0;
  });
  const current = $derived(pages[page]);
  const last = $derived(page === pages.length - 1);

  const MIXES: JewelColor[][] = [['red', 'blue'], ['blue', 'yellow'], ['red', 'yellow'], ['red', 'blue', 'white']];
  const LOOT = (['square', 'smallTriangle', 'legTriangle', 'bigTriangle', 'diamond', 'trapezoid'] as const).map((id, i) => ({
    id, cells: SHAPES[id].cells, color: (['red', 'blue', 'red', 'yellow', 'yellow', 'white'] as const)[i] ?? 'red',
  }));
</script>

{#snippet glyph(c: JewelColor)}
  <svg viewBox="0 0 1 1" width="14" height="14" aria-hidden="true">{#if !game.symbols}<circle cx=".5" cy=".5" r=".4" fill={JEWEL_HEX[c]} />{:else}<Glyph glyph={GLYPH[c]} x={0.5} y={0.5} size={0.95} fill={JEWEL_HEX[c]} />{/if}</svg>
{/snippet}

<Modal open={game.dialog === 'help'} label={s.helpTitle} onclose={() => (game.tutorial ? game.endTutorial(false) : (game.dialog = 'none'))}>
  <div class="dots" aria-label={s.helpPage(page + 1, pages.length)}>
    {#each pages as p, i (p.id)}<button class:on={i === page} aria-label={s.helpPage(i + 1, pages.length)} onclick={() => (page = i)}></button>{/each}
  </div>
  <h3><span class="num">{page + 1}/{pages.length}</span> {current?.title}</h3>
  <div class="panel" data-page={current?.id}>
    {#if current?.id === 'lore'}
      <div class="lore">
        <div class="thief"><Thief size={70} upsideDown mood="calm" /></div>
        <TutorialScene width={6} height={3} jewels={[{ shape: 'diamond', color: 'yellow', x: 1, y: 0 }, { shape: 'smallTriangle', color: 'blue', x: 4, y: 1 }]} faint />
      </div>
    {:else if current?.id === 'goal'}
      <TutorialScene width={7} height={4} jewels={[{ shape: 'legTriangle', color: 'red', x: 0, y: 1 }, { shape: 'diamond', color: 'yellow', x: 3, y: 0 }, { shape: 'smallTriangle', color: 'blue', x: 5, y: 3 }]} />
      <div class="loot">{#each [LOOT[2], LOOT[4], LOOT[1]] as j (j?.id)}{#if j}<JewelIcon cells={j.cells} color={JEWEL_HEX[j.color]} />{/if}{/each}</div>
    {:else if current?.id === 'torch'}
      <TutorialScene width={6} height={4} jewels={[{ shape: 'diamond', color: 'yellow', x: 3, y: 2 }]} faint shots={[16, 19]} empties={[0, 1, 2, 3, 4, 5]} />
    {:else if current?.id === 'wall'}
      <TutorialScene width={6} height={3} jewels={[{ shape: 'square', color: 'red', x: 3, y: 0 }]} faint shots={[16]} />
    {:else if current?.id === 'facet'}
      <TutorialScene width={7} height={5} jewels={[{ shape: 'diamond', color: 'yellow', x: 1, y: 1 }, { shape: 'diamond', color: 'yellow', x: 4, y: 2 }]} faint shots={[4]} />
    {:else if current?.id === 'colors'}
      <TutorialScene width={7} height={5} jewels={[{ shape: 'diamond', color: 'yellow', x: 1, y: 1 }, { shape: 'legTriangle', color: 'red', x: 4, y: 0 }]} faint shots={[2]} />
      <div class="mixes">
        {#each MIXES as m (m.join())}<span class="mix">{#each m as c, i (c)}{#if i}+{/if}{@render glyph(c)}{/each} = <i style="background: {laserFill(maskOf(...m))}"></i></span>{/each}
      </div>
    {:else if current?.id === 'shapes'}
      <div class="tools-row">
        <span><ToolIcon kind="trace" color={JEWEL_HEX.red} size={26} />{s.trace}</span>
        <span><ToolIcon kind="empty" color="" size={26} />{s.empty}</span>
        <span><ToolIcon kind="erase" color="" size={26} />{s.eraser}</span>
      </div>
      <div class="pair">
        <figure>
          <svg class="pic" viewBox="0 0 60 60" aria-hidden="true">
            <rect x="10" y="10" width="40" height="40" fill="#283586" stroke="rgba(170,195,255,.5)" stroke-dasharray="3 3" />
            <line x1="10" y1="10" x2="50" y2="10" stroke={JEWEL_HEX.red} stroke-width="5" stroke-linecap="round" />
            <circle cx="30" cy="16" r="4" fill="#fff" opacity=".8" />
          </svg>
          <figcaption>{s.tutorialWallTap}</figcaption>
        </figure>
        <figure>
          <svg class="pic" viewBox="0 0 60 60" aria-hidden="true">
            <rect x="10" y="10" width="40" height="40" fill="#283586" stroke="rgba(170,195,255,.5)" stroke-dasharray="3 3" />
            <line x1="10" y1="50" x2="50" y2="10" stroke={JEWEL_HEX.yellow} stroke-width="5" stroke-linecap="round" />
            <circle cx="30" cy="30" r="4" fill="#fff" opacity=".8" />
          </svg>
          <figcaption>{s.tutorialFacetTap}</figcaption>
        </figure>
      </div>
    {:else if current?.id === 'go'}
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
    {:else if current?.id === 'pillars'}
      <TutorialScene width={7} height={4} pillars={[{ kind: 'black', shape: 'square1', x: 1, y: 1 }, { kind: 'clear', shape: 'square1', x: 3, y: 2 }, { kind: 'prism', shape: 'square1', x: 5, y: 1 }]} shots={[1, 20, 5]} />
    {:else if current?.id === 'method'}
      <TutorialScene width={5} height={5} jewels={[{ shape: 'diamond', color: 'yellow', x: 1, y: 2 }]} shots={[1, 2, 11, 0]} paths={false} />
    {/if}
    {#each current?.body ?? [] as paragraph, i (i)}<p><Rich text={paragraph} /></p>{/each}
  </div>

  <div class="row nav">
    {#if page > 0}<button class="btn" onclick={() => page--}>{s.previous}</button>{/if}
    {#if last && game.tutorial}
      <button class="btn" onclick={() => game.endTutorial(false)}>{s.backHome}</button>
      <button class="btn primary" onclick={() => game.endTutorial(true)}>{s.tutorialPlay}</button>
    {:else if last}
      <button class="btn primary" onclick={() => (game.dialog = 'none')}>{s.gotIt}</button>
    {:else}
      <button class="btn primary" onclick={() => page++}>{s.next2}</button>
    {/if}
  </div>
</Modal>

<style>
  h3 { margin: 0; font-size: 18px; font-weight: 900; color: #fff; text-align: center; }
  .num { font-size: 12px; color: var(--muted); font-weight: 800; margin-right: 4px; }
  .dots { display: flex; justify-content: center; gap: 5px; flex-wrap: wrap; }
  .dots button { width: 8px; height: 8px; padding: 0; border-radius: 4px; border: none; background: var(--edge); transition: width 0.2s; }
  .dots button.on { width: 20px; background: var(--gold); }
  .panel { min-height: 0; display: flex; flex-direction: column; gap: 8px; }
  .panel p { margin: 0; font-size: 14.5px; line-height: 1.45; }
  .pic { width: 100%; height: auto; display: block; border-radius: 10px; background: #1c2160; }
  .lore { position: relative; padding-top: 64px; }
  .lore .thief { position: absolute; left: 50%; top: -6px; transform: translateX(-50%); }
  .loot { display: flex; justify-content: center; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
  .mark-label { font-size: 11px; font-weight: 900; fill: #ff6b85; text-anchor: middle; }
  .alarm-pic { display: flex; flex-direction: column; gap: 8px; }
  .levels { display: flex; justify-content: space-around; }
  .levels span { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .levels small { font-size: 12px; font-weight: 900; color: var(--muted); }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .pair .pic { max-height: 110px; }
  figure { margin: 0; display: flex; flex-direction: column; gap: 4px; }
  figcaption { font-size: 12.5px; color: #dbe1ff; text-align: center; }
  .tools-row { display: flex; justify-content: center; gap: 18px; font-weight: 900; }
  .tools-row span { display: inline-flex; align-items: center; gap: 6px; }
  .mixes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 10px; font-size: 13px; font-weight: 800; color: #dbe1ff; }
  .mix { display: flex; align-items: center; gap: 3px; white-space: nowrap; }
  .mix i { width: 18px; height: 18px; border-radius: 50%; flex: none; border: 1.5px solid rgba(255, 255, 255, 0.5); }
  .nav { margin-top: 4px; }
  :global(b) { color: #fff; }
</style>
