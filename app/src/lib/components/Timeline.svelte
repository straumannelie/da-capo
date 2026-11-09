<script lang="ts">
	import { resolve } from '$app/paths';
	import { lifeYears } from '#lib/domain/format.ts';
	import type { Timeline } from '#lib/domain/timeline.ts';
	import type { TimelineComposer } from '#lib/server/repo/composers.ts';
	import LifeLine from './LifeLine.svelte';

	let { timeline }: { timeline: Timeline<TimelineComposer> } = $props();
</script>

<div class="scroller">
	<div class="frise">
		{#each timeline.bands as band (band.id)}
			<div
				class="band"
				style:left="{band.left}%"
				style:width="{band.width}%"
				style:--band-color={band.color}
				aria-hidden="true"
			>
				<span class="band-name">{band.label}</span>
				<span class="barline"></span>
			</div>
		{/each}

		<ol class="rows">
			{#each timeline.rows as row (row.id)}
				<li class="row">
					<a
						class="name"
						class:heard={row.listened}
						href={resolve('/compositeurs/[id]', { id: String(row.id) })}
						style:right="calc({100 - row.left}% + 16px)"
					>
						{row.name}<span class="sr-only"
							>, {lifeYears(row.birthYear, row.deathYear)}, {row.listened
								? 'déjà écouté'
								: 'pas encore écouté'}</span
						>
					</a>
					<span aria-hidden="true">
						<LifeLine placement={row} listened={row.listened} />
					</span>
				</li>
			{/each}
		</ol>

		<div class="axis" aria-hidden="true">
			{#each timeline.ticks as tick (tick.year)}
				<span class="tick" style:left="{tick.left}%">{tick.year}</span>
			{/each}
		</div>
	</div>
</div>

<style>
	.scroller {
		overflow-x: auto;
	}

	.frise {
		position: relative;
		min-width: 720px;
		padding-top: 72px;
	}

	.band {
		position: absolute;
		inset-block: 0;
		background: color-mix(in srgb, var(--band-color) 7%, transparent);
	}

	.band-name {
		display: block;
		padding: 14px 14px 0;
		font-family: var(--font-display);
		font-style: italic;
		font-size: 22px;
		line-height: 1.1;
		color: var(--band-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.barline {
		position: absolute;
		top: 64px;
		bottom: 0;
		right: 0;
		width: 4px;
		border-inline: 1px solid var(--rule-strong);
	}

	.rows {
		position: relative;
		list-style: none;
		margin: 0;
		padding: 0;
		background-image: repeating-linear-gradient(
			to bottom,
			transparent 0 12px,
			var(--staff) 12px 13px
		);
	}

	.row {
		position: relative;
		height: 26px;
	}

	.name {
		position: absolute;
		top: 2px;
		font-size: 13px;
		font-weight: 500;
		white-space: nowrap;
		color: var(--ink-muted);
		text-decoration: none;
	}

	.name.heard {
		color: var(--ink);
	}

	.name:hover {
		color: var(--accent);
		text-decoration: underline;
	}

	.axis {
		position: relative;
		height: 36px;
		margin-top: 10px;
		border-top: 1px solid var(--rule-strong);
	}

	.tick {
		position: absolute;
		top: 0;
		padding-top: 10px;
		transform: translateX(-50%);
		font-size: 12px;
		color: var(--ink-muted);
	}

	.tick::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		width: 1px;
		height: 6px;
		background: var(--rule-strong);
	}
</style>
