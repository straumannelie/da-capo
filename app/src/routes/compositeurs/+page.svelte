<script lang="ts">
	import { resolve } from '$app/paths';
	import NoteHead from '#lib/components/NoteHead.svelte';
	import { countLabel, lifeYears } from '#lib/domain/format.ts';
	import { epochLabel } from '#lib/domain/periods.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Compositeurs – Da capo</title>
</svelte:head>

<div class="page">
	<h1 class="display-title">Compositeurs</h1>

	<form class="search" method="GET" role="search">
		<label class="sr-only" for="q">Chercher un compositeur</label>
		<input
			class="input"
			id="q"
			name="q"
			type="search"
			placeholder="Chercher un compositeur"
			value={data.query}
			autocomplete="off"
		/>
		<button class="button secondary" type="submit">Chercher</button>
	</form>

	{#if data.total === 0}
		<p class="empty muted">
			{data.query === ''
				? 'Aucun compositeur importé. Lance l’import des données de référence (voir le README).'
				: 'Aucun compositeur ne correspond à cette recherche.'}
		</p>
	{/if}

	{#each data.groups as group (group.id)}
		<section class="group">
			<h2 class="group-title" style:color={group.color}>{group.label}</h2>
			<ul class="ruled">
				{#each group.composers as composer (composer.id)}
					<li class="composer">
						<NoteHead color={group.color} filled={composer.listenCount > 0} />
						<a class="name" href={resolve('/compositeurs/[id]', { id: String(composer.id) })}
							>{composer.completeName}</a
						>
						<span class="meta muted">
							{lifeYears(composer.birthYear, composer.deathYear)}, {epochLabel(composer.epoch)}
						</span>
						<span class="stats small muted">
							{composer.listenCount > 0
								? countLabel(composer.listenCount, 'écoute', 'écoutes')
								: composer.followed
									? 'Sur la frise'
									: ''}
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.search {
		display: flex;
		gap: 12px;
		max-width: 560px;
		margin-top: 32px;
	}

	.empty {
		margin-top: 32px;
	}

	.group {
		margin-top: 48px;
	}

	.group-title {
		margin-bottom: 12px;
		font-style: italic;
		font-size: 30px;
	}

	.composer {
		display: grid;
		grid-template-columns: 16px minmax(0, 2fr) minmax(0, 2fr) minmax(0, 1fr);
		gap: 6px 16px;
		align-items: baseline;
		padding: 14px 0;
	}

	.name {
		font-weight: 600;
		text-decoration: none;
	}

	.name:hover {
		text-decoration: underline;
	}

	.stats {
		text-align: right;
	}

	@media (max-width: 640px) {
		.composer {
			grid-template-columns: 16px minmax(0, 1fr);
		}

		.meta,
		.stats {
			grid-column: 2;
			text-align: left;
		}
	}
</style>
