<script lang="ts">
	let {
		value = $bindable(null),
		name = 'rating',
		legend = 'Ma note'
	}: { value?: number | null; name?: string; legend?: string } = $props();

	const scale = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
</script>

<fieldset class="picker">
	<div class="header">
		<legend>{legend}</legend>
		<span class="current" aria-hidden="true">{value === null ? '' : `${value} sur 10`}</span>
	</div>
	<div class="grid">
		{#each scale as option (option)}
			<label class="option">
				<input class="sr-only" type="radio" {name} value={option} bind:group={value} required />
				<span>{option}</span>
			</label>
		{/each}
	</div>
</fieldset>

<style>
	.picker {
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}

	.header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	legend {
		float: left;
		padding: 0;
	}

	.current {
		font-family: var(--font-display);
		font-size: 24px;
		line-height: 1;
		color: var(--accent);
	}

	.grid {
		clear: both;
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 8px;
	}

	.option span {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 48px;
		border: 1px solid var(--field-border);
		border-radius: var(--radius);
		background: var(--paper-raised);
		font-family: var(--font-display);
		font-size: 20px;
		cursor: pointer;
	}

	.option input:checked + span {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--paper);
	}

	.option input:focus-visible + span {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
