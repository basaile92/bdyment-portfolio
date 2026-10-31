<script lang="ts">
  import type { GameController } from '../GameController.svelte';
  import Glyph from './Glyph.svelte';
  import { GLYPH, JEWEL_HEX } from '../presenters/palette';
  import { JEWEL_COLORS } from '../../domain';

  /** Colour symbols on/off: offered on the welcome card and kept in the settings. */
  let { game }: { game: GameController } = $props();
</script>

<label class="switch">
  <span>
    <strong>{game.s.symbols}
      {#each JEWEL_COLORS as c (c)}<svg viewBox="0 0 1 1" width="13" height="13" aria-hidden="true"><Glyph glyph={GLYPH[c]} x={0.5} y={0.5} size={0.9} fill={JEWEL_HEX[c]} /></svg>{/each}
    </strong>
    <small>{game.s.symbolsSub}</small>
  </span>
  <input type="checkbox" checked={game.symbols} onchange={(e) => game.updateSettings({ symbols: e.currentTarget.checked })} />
</label>

<style>
  .switch { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 14px; background: var(--slot); min-height: 56px; text-align: left; }
  .switch span { flex: 1; display: flex; flex-direction: column; }
  strong { font-size: 15px; font-weight: 900; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  strong svg { flex: none; }
  small { font-size: 12.5px; font-weight: 700; color: var(--muted); }
  input { width: 26px; height: 26px; accent-color: var(--gold); flex: none; }
</style>
