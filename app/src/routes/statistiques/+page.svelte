<script lang="ts">
	import { resolve } from '$app/paths';
	import { countLabel, formatDate } from '#lib/domain/format.ts';
	import type { Share } from '#lib/domain/stats.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let stats = $derived(data.stats);
	const decimal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

	let summary = $derived(
		[
			countLabel(stats.totals.listens, 'écoute', 'écoutes'),
			countLabel(stats.totals.works, 'œuvre', 'œuvres'),
			countLabel(stats.totals.composers, 'compositeur', 'compositeurs')
		].join(', ') +
			(stats.totals.concertListens > 0
				? `, dont ${countLabel(stats.totals.concertListens, 'en concert', 'en concert')}.`
				: '.')
	);

	let rankings = $derived<{ id: string; title: string; entries: readonly Share[] }[]>([
		{ id: 'performers', title: 'Interprètes les plus présents', entries: stats.performers },
		{ id: 'genres', title: 'Par genre', entries: stats.genres }
	]);
</script>

<svelte:head>
	<title>Statistiques – Da capo</title>
</svelte:head>

<div class="page">
	<h1 class="display-title">Une année d’écoute</h1>
	<p class="lede">{summary}</p>

	{#if stats.totals.listens === 0}
		<p class="empty muted">
			Rien à mesurer pour l’instant. <a href={resolve('/ecoute')}>Note une première écoute</a> et cette
			page se remplira au fil des semaines.
		</p>
	{:else}
		<section class="block">
			<h2 class="section-title">Les douze derniers mois</h2>
			<p class="muted small caption">
				Une note par jour, d’autant plus pleine que tu as écouté ce jour-là.
				{countLabel(stats.heatmap.activeDays, 'jour', 'jours')} d’écoute sur la période.
			</p>
			<div class="scroller">
				<div
					class="heatmap"
					role="img"
					aria-label="{countLabel(stats.heatmap.total, 'écoute', 'écoutes')} sur {countLabel(
						stats.heatmap.activeDays,
						'jour',
						'jours'
					)} au cours des douze derniers mois"
				>
					<div class="months" aria-hidden="true">
						{#each stats.heatmap.months as month (month.week)}
							<span style:grid-column="{month.week + 1} / span 3">{month.label}</span>
						{/each}
					</div>
					<div class="days" aria-hidden="true">
						{#each stats.heatmap.weeks as week, weekIndex (weekIndex)}
							{#each week as day (day.date)}
								<span
									class="day level-{day.level}"
									title="{formatDate(day.date)} : {countLabel(day.count, 'écoute', 'écoutes')}"
								></span>
							{/each}
						{/each}
					</div>
				</div>
			</div>
		</section>

		<div class="grid">
			<section class="block">
				<h2 class="section-title">Par période</h2>
				<ul class="bars">
					{#each stats.periods as period (period.key)}
						<li>
							<span class="bar-label">{period.label}</span>
							<span class="track"
								><span
									class="fill"
									style:width="{period.ratio * 100}%"
									style:background={period.color}
								></span></span
							>
							<span class="count">{period.count}</span>
						</li>
					{/each}
				</ul>
			</section>

			<section class="block">
				<h2 class="section-title">Mes notes</h2>
				<p class="muted small caption">
					Moyenne : {stats.ratings.average === null ? '–' : decimal.format(stats.ratings.average)} sur
					10
				</p>
				<ol class="histogram">
					{#each stats.ratings.counts as entry (entry.rating)}
						<li>
							<span class="count small">{entry.count === 0 ? '' : entry.count}</span>
							<span class="column"
								><span class="column-fill" style:height="{entry.ratio * 100}%"></span></span
							>
							<span class="rating-label">{entry.rating}</span>
							<span class="sr-only">
								: {countLabel(entry.count, 'écoute notée', 'écoutes notées')}
								{entry.rating}</span
							>
						</li>
					{/each}
				</ol>
			</section>

			<section class="block">
				<h2 class="section-title">Compositeurs les plus écoutés</h2>
				<ul class="bars">
					{#each stats.composers as composer (composer.key)}
						<li>
							<a class="bar-label" href={resolve('/compositeurs/[id]', { id: String(composer.id) })}
								>{composer.label}</a
							>
							<span class="track"
								><span
									class="fill"
									style:width="{composer.ratio * 100}%"
									style:background={composer.color ?? 'var(--ink)'}
								></span></span
							>
							<span class="count">{composer.count}</span>
						</li>
					{/each}
				</ul>
			</section>

			{#each rankings as ranking (ranking.id)}
				{#if ranking.entries.length > 0}
					<section class="block">
						<h2 class="section-title">{ranking.title}</h2>
						<ul class="bars">
							{#each ranking.entries as entry (entry.key)}
								<li>
									<span class="bar-label">{entry.label}</span>
									<span class="track"
										><span class="fill neutral" style:width="{entry.ratio * 100}%"></span></span
									>
									<span class="count">{entry.count}</span>
								</li>
							{/each}
						</ul>
					</section>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.empty {
		margin-top: 32px;
	}

	.block {
		margin-top: 48px;
		min-width: 0;
	}

	.caption {
		margin-top: 6px;
	}

	.scroller {
		margin-top: 20px;
		overflow-x: auto;
	}

	.heatmap {
		display: inline-flex;
		flex-direction: column;
		gap: 6px;
		padding-bottom: 6px;
	}

	.months,
	.days {
		display: grid;
		grid-template-columns: repeat(52, 14px);
		column-gap: 3px;
	}

	.months {
		font-size: 12px;
		color: var(--ink-muted);
		white-space: nowrap;
	}

	.days {
		grid-template-rows: repeat(7, 12px);
		grid-auto-flow: column;
		row-gap: 3px;
	}

	.day {
		width: 13px;
		height: 10px;
		margin: 1px 0;
		border-radius: 50%;
		transform: rotate(-22deg);
		background: var(--accent);
	}

	.level-0 {
		background: transparent;
		border: 1px solid var(--rule-strong);
	}

	.level-1 {
		opacity: 0.35;
	}

	.level-2 {
		opacity: 0.55;
	}

	.level-3 {
		opacity: 0.78;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
		column-gap: 64px;
	}

	.bars {
		list-style: none;
		margin: 16px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.bars li {
		display: grid;
		grid-template-columns: minmax(0, 11rem) minmax(0, 1fr) 2.5rem;
		gap: 12px;
		align-items: center;
	}

	.bar-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 15px;
	}

	a.bar-label {
		text-decoration: none;
	}

	a.bar-label:hover {
		text-decoration: underline;
	}

	.track {
		height: 8px;
		border-radius: 4px;
		background: var(--rule);
	}

	.fill {
		display: block;
		height: 8px;
		border-radius: 4px;
	}

	.fill.neutral {
		background: var(--ink-soft);
	}

	.count {
		text-align: right;
		color: var(--ink-soft);
		font-size: 15px;
	}

	.histogram {
		list-style: none;
		margin: 20px 0 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(10, minmax(0, 1fr));
		gap: 8px;
		align-items: end;
	}

	.histogram li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.histogram .count {
		min-height: 1.2em;
		text-align: center;
	}

	.column {
		display: flex;
		align-items: flex-end;
		width: 100%;
		height: 120px;
		border-bottom: 1px solid var(--rule-strong);
	}

	.column-fill {
		display: block;
		width: 100%;
		border-radius: 3px 3px 0 0;
		background: var(--accent);
	}

	.rating-label {
		font-family: var(--font-display);
		font-size: 18px;
	}
</style>
