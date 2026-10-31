<script lang="ts">
  /** Text where **double stars** mark bold parts (translations stay plain strings, no HTML). */
  let { text }: { text: string } = $props();
  const parts = $derived(text.split('**'));
</script>

{#each parts as part, i (i)}{#if i % 2 === 1}<b>{part}</b>{:else}{part}{/if}{/each}
