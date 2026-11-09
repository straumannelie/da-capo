<script lang="ts">
	import { resolve } from '$app/paths';
	import { countLabel, formatDate } from '#lib/domain/format.ts';
	import type { ConcertListItem } from '#lib/server/repo/concerts.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let sections = $derived([
		{ id: 'upcoming', label: 'À venir', concerts: data.upcoming, upcoming: true },
		{ id: 'past', label: 'Passés', concerts: data.past, upcoming: false }
	]);

	function status(concert: ConcertListItem, upcoming: boolean): string {
		if (concert.programSize === 0) {
			return 'Programme à compléter';
		}
		if (upcoming) {
			return `Programme : ${countLabel(concert.programSize, 'œuvre', 'œuvres')}`;
		}
		return `${concert.ratedCount} sur ${countLabel(concert.programSize, 'œuvre notée', 'œuvres notées')}`;
	}
</script>

<svelte:head>
	<title>Concerts – Da capo</title>
</svelte:head>

<div class="page narrow">
	<div class="header">
		<h1 class="display-title">Concerts</h1>
		<a class="button" href={resolve('/concerts/nouveau')}>Ajouter un concert</a>
	</div>
	<p class="lede">
		Chaque œuvre entendue en concert devient une version à part entière : elle rejoint le
		comparateur de l’œuvre, ta frise et tes statistiques.
	</p>

	{#if data.upcoming.length === 0 && data.past.length === 0}
		<p class="empty muted">
			Aucun concert pour l’instant. Ajoute ta prochaine soirée, programme compris, pour préparer
			l’écoute.
		</p>
	{/if}

	{#each sections as section (section.id)}
		{#if section.concerts.length > 0}
			<section class="group">
				<h2 class="section-title">{section.label}</h2>
				<ol class="ruled">
					{#each section.concerts as concert (concert.id)}
						<li>
							<a class="concert" href={resolve('/concerts/[id]', { id: String(concert.id) })}>
								<span class="date">{formatDate(concert.date)}</span>
								<span class="name">{concert.title ?? concert.venue}</span>
								<span class="small muted">
									{[concert.title === null ? null : concert.venue, concert.composers.join(', ')]
										.filter(Boolean)
										.join(', ')}
								</span>
								<span class="small status" class:upcoming={section.upcoming}
									>{status(concert, section.upcoming)}</span
								>
							</a>
						</li>
					{/each}
				</ol>
			</section>
		{/if}
	{/each}
</div>

<style>
	.header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 16px 24px;
	}

	.empty {
		margin-top: 32px;
	}

	.group {
		margin-top: 48px;
	}

	.group ol {
		margin-top: 12px;
	}

	.concert {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 18px 0;
		text-decoration: none;
	}

	.date {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 20px;
		color: var(--accent);
	}

	.name {
		font-weight: 600;
		font-size: 17px;
	}

	.concert:hover .name {
		text-decoration: underline;
	}

	.status {
		margin-top: 4px;
		color: var(--ink-soft);
	}

	.status.upcoming {
		color: var(--accent);
	}
</style>
