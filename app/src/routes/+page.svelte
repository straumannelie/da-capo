<script lang="ts">
	import { resolve } from '$app/paths';
	import ListenItem from '#lib/components/ListenItem.svelte';
	import NoteHead from '#lib/components/NoteHead.svelte';
	import Timeline from '#lib/components/Timeline.svelte';
	import { periodOf } from '#lib/domain/periods.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Frise – Da capo</title>
</svelte:head>

<div class="page">
	<div class="intro">
		<h1 class="display-title">Quatre siècles sur une portée</h1>
		<p class="lede">
			Chaque compositeur suivi est une note posée sur sa vie. Note pleine : déjà écouté. Note vide :
			encore à découvrir.
		</p>
	</div>

	<div class="layout">
		<section class="frise" aria-label="Frise des compositeurs">
			{#if data.timeline.rows.length > 0}
				<Timeline timeline={data.timeline} />
			{:else}
				<div class="empty">
					<p>
						La frise est vide. Importe les données de référence, puis suis des compositeurs depuis
						leur fiche.
					</p>
					<a class="button secondary" href={resolve('/compositeurs')}>Parcourir les compositeurs</a>
				</div>
			{/if}
		</section>

		<aside class="aside">
			<section>
				<h2 class="section-title">Dernières écoutes</h2>
				{#if data.recent.length > 0}
					<ol class="ruled list">
						{#each data.recent as listen (listen.id)}
							<li><ListenItem {listen} currentYear={data.currentYear} /></li>
						{/each}
					</ol>
					<a class="more" href={resolve('/journal')}>Tout le journal</a>
				{:else}
					<p class="muted hint">
						Aucune écoute pour l’instant. <a href={resolve('/ecoute')}>Note la première.</a>
					</p>
				{/if}
			</section>

			<section>
				<h2 class="section-title">À écouter ensuite</h2>
				{#if data.queue.length > 0}
					<ul class="ruled list">
						{#each data.queue as work (work.id)}
							<li class="queued">
								<NoteHead color={periodOf(work.epoch, work.birthYear).color} filled={false} />
								<span class="queued-body">
									<span class="small muted">{work.composerName}</span>
									<a href={resolve('/oeuvres/[id]', { id: String(work.id) })}>{work.title}</a>
								</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="muted hint">Ajoute des œuvres à ta file depuis leur page.</p>
				{/if}
			</section>
		</aside>
	</div>
</div>

<style>
	.intro {
		max-width: 760px;
	}

	.layout {
		display: flex;
		flex-wrap: wrap;
		gap: 56px;
		margin-top: 48px;
		align-items: flex-start;
	}

	.frise {
		flex: 999 1 640px;
		min-width: 0;
	}

	.aside {
		flex: 1 1 300px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 48px;
	}

	.list {
		margin-top: 10px;
	}

	.more {
		display: inline-block;
		margin-top: 12px;
		font-size: 14px;
		color: var(--ink-soft);
	}

	.hint {
		margin-top: 12px;
	}

	.queued {
		display: flex;
		gap: 16px;
		align-items: baseline;
		padding: 14px 0;
	}

	.queued-body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.queued-body a {
		font-weight: 600;
		font-size: 15px;
		line-height: 1.35;
		text-decoration: none;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
		padding: 32px 0;
		border-top: 1px solid var(--rule);
		color: var(--ink-soft);
	}
</style>
