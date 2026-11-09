<script lang="ts">
	import type { Placement } from '#lib/domain/timeline.ts';
	import NoteHead from './NoteHead.svelte';

	let { placement, listened }: { placement: Placement; listened: boolean } = $props();

	let stroke = $derived(
		listened ? placement.color : `color-mix(in srgb, ${placement.color} 45%, transparent)`
	);
	let fill = $derived(
		placement.alive ? `linear-gradient(to right, ${stroke} 80%, transparent)` : stroke
	);
</script>

<span
	class="line"
	style:left="{placement.left}%"
	style:width="{placement.width}%"
	style:background={fill}
></span>
{#if !placement.alive}
	<span class="bar" style:left="calc({placement.end}% - 1px)" style:background={stroke}></span>
{/if}
<span class="head" style:left="calc({placement.left}% - 8px)">
	<NoteHead color={placement.color} filled={listened} />
</span>

<style>
	.line,
	.bar,
	.head {
		position: absolute;
	}

	.line {
		top: 12px;
		height: 2px;
	}

	.bar {
		top: 6px;
		width: 2px;
		height: 14px;
	}

	.head {
		top: 6px;
		line-height: 0;
	}
</style>
