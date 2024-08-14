<script lang="ts">
  export let shutterSpeed: string;
  console.log(shutterSpeed.split("/"))
</script>

{#if shutterSpeed.split("/").length === 2}
  {@const [numerator, denominator] = shutterSpeed.split("/")}
  <sup>{numerator}</sup>&frasl;<sub>{denominator}</sub>
{:else}
    {shutterSpeed}"
{/if}
