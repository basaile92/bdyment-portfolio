<script lang="ts">
  /**
   * A switched-off torch seen from the front: smooth chrome bezel, dark glass lens over a
   * mirror reflector (faint rings), the bulb in the middle and a glossy reflection. Board units.
   */
  let { x, y }: { x: number; y: number } = $props();
</script>

<g class="torch" aria-hidden="true">
  <circle cx={x} cy={y} r=".26" fill="url(#bezel)" />
  <circle cx={x} cy={y} r=".205" fill="url(#reflector)" stroke="#20254a" stroke-width=".018" />
  <circle cx={x} cy={y} r=".15" fill="none" stroke="#c9d2f2" stroke-opacity=".18" stroke-width=".01" />
  <circle cx={x} cy={y} r=".095" fill="none" stroke="#c9d2f2" stroke-opacity=".14" stroke-width=".01" />
  <circle cx={x} cy={y} r=".04" fill="#8b90a8" stroke="#3a3f5e" stroke-width=".012" />
  <circle cx={x - 0.01} cy={y - 0.012} r=".014" fill="#e6e9f5" />
  <path d="M{x - 0.15} {y - 0.06}a.17 .17 0 0 1 .11 -.105" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width=".026" stroke-linecap="round" />
</g>
