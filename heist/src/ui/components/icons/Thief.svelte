<script lang="ts">
  /**
   * The thief. Two faces: calm by default, and tense (wide eyes, raised brows, round "o" mouth)
   * that a parent can show with the `.face-calm` / `.face-tense` classes, e.g. while he drops on his rope.
   */
  let { size = 66, upsideDown = false, mood = 'calm' }: { size?: number; upsideDown?: boolean; mood?: 'calm' | 'sad' | 'happy' } = $props();
</script>

<svg viewBox="0 0 64 64" width={size} height={size} class:upside={upsideDown} class="mood-{mood}" aria-hidden="true">
  <path d="M12 62c2-12 10-17 20-17s18 5 20 17z" fill="#4b3fb0" />
  <circle cx="32" cy="30" r="14" fill="#ffd2b0" />
  <path d="M17 28c0-10 7-16 15-16s15 6 15 16c-5-3-10-4-15-4s-10 1-15 4z" fill="#2b2366" />
  <rect x="17.5" y="27" width="29" height="7.5" rx="3.7" fill="#ff4fd8" />
  <g class="face-calm">
    <circle cx="26" cy="30.7" r="2.1" fill="#fff" />
    <circle cx="38" cy="30.7" r="2.1" fill="#fff" />
    <path d="M28 38.5q4 3 8 0" stroke="#a5523a" stroke-width="1.8" fill="none" stroke-linecap="round" />
  </g>
  <!-- Plan was wrong: ":(" -->
  <g class="face-sad">
    <circle cx="26" cy="30.7" r="2.1" fill="#fff" />
    <circle cx="38" cy="30.7" r="2.1" fill="#fff" />
    <path d="M27.5 40.5q4.5 -3.5 9 0" stroke="#a5523a" stroke-width="1.9" fill="none" stroke-linecap="round" />
  </g>
  <!-- Plan was right: big grin. -->
  <g class="face-happy">
    <path d="M23.5 31.5q2.5 -3 5 0M35.5 31.5q2.5 -3 5 0" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" />
    <path d="M26.5 37.5q5.5 5.5 11 0z" fill="#a5523a" />
  </g>
  <g class="face-tense">
    <circle cx="26" cy="30.7" r="3.1" fill="#fff" />
    <circle cx="38" cy="30.7" r="3.1" fill="#fff" />
    <circle cx="26" cy="29.4" r="1.4" fill="#1b1745" />
    <circle cx="38" cy="29.4" r="1.4" fill="#1b1745" />
    <path d="M21.5 24.5l6 -1.6M42.5 24.5l-6 -1.6" stroke="#2b2366" stroke-width="1.6" stroke-linecap="round" />
    <circle cx="32" cy="39.5" r="2.4" fill="#a5523a" />
  </g>
</svg>

<style>
  .upside { transform: rotate(180deg); }
  .face-calm, .face-tense, .face-sad, .face-happy { transition: opacity 0.15s; }
  .face-tense, .face-sad, .face-happy { opacity: 0; }
  /* A mood wins over the default face and over the hover face. */
  .mood-sad .face-sad, .mood-happy .face-happy { opacity: 1 !important; }
  .mood-sad .face-calm, .mood-sad .face-tense, .mood-happy .face-calm, .mood-happy .face-tense { opacity: 0 !important; }
</style>
