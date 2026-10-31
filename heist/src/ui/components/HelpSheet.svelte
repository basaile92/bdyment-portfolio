<script lang="ts">
  import { JEWEL_COLORS, maskOf, type JewelColor } from '../../domain';
  import type { GameController } from '../GameController.svelte';
  import { GLYPH, JEWEL_HEX, laserHex, laserName } from '../presenters/palette';
  import Glyph from './Glyph.svelte';
  import ToolIcon from './icons/ToolIcon.svelte';
  import Modal from './Modal.svelte';
  import Rich from './Rich.svelte';

  /** One-page reminder of the rules. Learning happens in the training rooms. */
  let { game }: { game: GameController } = $props();
  const s = $derived(game.s);

  const MIXES: JewelColor[][] = [['red', 'blue'], ['blue', 'yellow'], ['red', 'yellow'], ['red', 'blue', 'yellow'], ['blue', 'white'], ['red', 'white'], ['yellow', 'white']];
</script>

{#snippet glyph(c: JewelColor)}
  <svg viewBox="0 0 1 1" width="14" height="14" aria-hidden="true"><Glyph glyph={GLYPH[c]} x={0.5} y={0.5} size={0.95} fill={JEWEL_HEX[c]} /></svg>
{/snippet}

<Modal open={game.dialog === 'help'} label={s.helpTitle} onclose={() => (game.dialog = 'none')}>
  <h2>{s.helpTitle}</h2>
  <section>
    <h3>{s.helpTest}</h3>
    <p><Rich text={s.helpTestText} /></p>
  </section>
  <section class="tools">
    <h3>{s.helpWalls}</h3>
    <div><ToolIcon kind="wall" color={JEWEL_HEX.red} size={34} /><p><Rich text={s.helpWall} /></p></div>
    <div><ToolIcon kind="facet" color={JEWEL_HEX.red} size={34} /><p><Rich text={s.helpFacet} /></p></div>
  </section>
  <section>
    <h3>{s.helpColors}</h3>
    <p class="legend">{#each JEWEL_COLORS as c (c)}<span>{@render glyph(c)}{s.colors[c]}</span>{/each}</p>
    <p>{s.helpColorsText}</p>
    <div class="mixes">
      {#each MIXES as m (m.join())}
        <span class="mix">{#each m as c, i (c)}{#if i}+{/if}{@render glyph(c)}{/each} = <i style="background: {laserHex(maskOf(...m))}"></i>{laserName(maskOf(...m), s)}</span>
      {/each}
    </div>
  </section>
  <section>
    <h3>{s.helpDraw}</h3>
    <p><Rich text={s.helpDrawText} /></p>
  </section>
  <section>
    <h3>{s.helpStars}</h3>
    <p>{s.helpStarsText}</p>
  </section>
  <button class="btn primary" onclick={() => (game.dialog = 'none')}>{s.gotIt}</button>
</Modal>

<style>
  section { display: flex; flex-direction: column; gap: 4px; }
  h3 { margin: 0; font-size: 15px; font-weight: 900; color: #fff; }
  .tools div { display: flex; align-items: center; gap: 10px; }
  .legend { display: flex; gap: 14px; flex-wrap: wrap; font-weight: 800; }
  .legend span { display: inline-flex; align-items: center; gap: 4px; }
  .mixes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 10px; font-size: 13px; font-weight: 800; color: #dbe1ff; }
  .mix { display: flex; align-items: center; gap: 3px; white-space: nowrap; }
  .mix i { width: 14px; height: 14px; border-radius: 50%; flex: none; border: 1.5px solid rgba(255, 255, 255, 0.5); }
  :global(b) { color: #fff; }
</style>
