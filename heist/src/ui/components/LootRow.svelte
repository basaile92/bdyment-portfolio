<script lang="ts">
  import type { GameController } from '../GameController.svelte';
  import { GLYPH, JEWEL_HEX } from '../presenters/palette';
  import Glyph from './Glyph.svelte';
  import JewelIcon from './icons/JewelIcon.svelte';
  import UiIcon from './icons/UiIcon.svelte';

  let { game }: { game: GameController } = $props();

  const found = $derived(game.recognized.filter(Boolean).length);
</script>

<section class="loot" aria-label={game.s.lootLabel(found, game.heist.jewels.length)}>
  <h2>{game.s.loot} <span>{found}/{game.heist.jewels.length}</span></h2>
  <ul>
    {#each game.heist.jewels as j, i (i)}
      <li class:found={game.recognized[i]} title={game.s.jewelNamed(game.s.colors[j.color])}>
        <JewelIcon cells={j.shape.cells} color={JEWEL_HEX[j.color]} />
        {#if game.symbols}<svg class="glyph" viewBox="0 0 1 1" width="12" height="12" aria-hidden="true"><Glyph glyph={GLYPH[j.color]} x={0.5} y={0.5} size={0.9} fill={JEWEL_HEX[j.color]} /></svg>{/if}
        {#if game.recognized[i]}<span class="tick"><UiIcon name="check" size={12} /></span>{/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .loot { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  h2 { margin: 0; font-family: var(--title-font); font-weight: 400; font-size: 13px; letter-spacing: 2px; color: var(--gold); }
  h2 span { font-family: 'Nunito', sans-serif; font-weight: 900; letter-spacing: 0; color: var(--muted); }
  ul { display: flex; justify-content: center; align-items: flex-end; gap: 14px; margin: 0; padding: 0; list-style: none; }
  li { position: relative; display: flex; align-items: flex-end; gap: 2px; opacity: 0.75; transition: opacity 0.2s; }
  li.found { opacity: 1; }
  .glyph { margin-bottom: -2px; }
  .tick {
    position: absolute; right: 8px; top: -8px; width: 18px; height: 18px; border-radius: 9px; background: var(--cyan); color: #0b0f30;
    display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px var(--bg);
  }
</style>
