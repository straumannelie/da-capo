<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import NoteHead from '#lib/components/NoteHead.svelte';
	import { formatDate } from '#lib/domain/format.ts';
	import { periodOf } from '#lib/domain/periods.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let concert = $derived(data.concert);
	let upcoming = $derived(concert.date > data.today);
	let concertPath = $derived(resolve('/concerts/[id]', { id: String(concert.id) }));
	let rateHref = (workId: number, recordingId: number) =>
		resolve(
			`/ecoute?oeuvre=${workId}&version=${recordingId}&date=${concert.date}&suite=${encodeURIComponent(concertPath)}`
		);
</script>

<svelte:head>
	<title>{concert.title ?? concert.venue} – Da capo</title>
</svelte:head>

<div class="page narrow">
	<a class="small back" href={resolve('/concerts')}>Tous les concerts</a>

	<header class="hero">
		<p class="date">
			{formatDate(concert.date)}
			{#if upcoming}<span class="badge">À venir</span>{/if}
		</p>
		<h1 class="display-title">{concert.title ?? concert.venue}</h1>
		<p class="lede">{concert.title ? `${concert.venue}. ` : ''}{concert.performers}</p>
	</header>

	<section class="block">
		<h2 class="section-title">Programme</h2>
		{#if concert.program.length === 0}
			<p class="muted hint">Le programme est vide. Ajoute les œuvres annoncées ci-dessous.</p>
		{:else}
			<ol class="program">
				{#each concert.program as item, index (item.recordingId)}
					<li class="item">
						<span class="position" aria-hidden="true">{index + 1}</span>
						<span class="body">
							<span class="small muted">{item.composerName}</span>
							<a
								href={resolve(`/oeuvres/[id]?version=${item.recordingId}`, {
									id: String(item.workId)
								})}>{item.title}</a
							>
							{#if item.performers !== concert.performers}
								<span class="small muted">{item.performers}</span>
							{/if}
						</span>
						<span class="outcome">
							{#if item.summary.latestRating !== null}
								<span class="rating"
									>{item.summary.latestRating}<span class="sr-only"> sur 10</span></span
								>
							{:else if upcoming}
								<span class="todo small">
									<NoteHead color={periodOf(item.epoch, item.birthYear).color} filled={false} />
									À découvrir
								</span>
							{:else}
								<a class="button secondary" href={rateHref(item.workId, item.recordingId)}>Noter</a>
							{/if}
							<form method="POST" action="?/removeItem" use:enhance>
								<input type="hidden" name="recordingId" value={item.recordingId} />
								<button
									class="remove"
									type="submit"
									aria-label="Retirer {item.title} du programme"
									title="Retirer du programme"
								>
									<svg
										aria-hidden="true"
										width="14"
										height="14"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.6"
										stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"></path></svg
									>
								</button>
							</form>
						</span>
					</li>
				{/each}
			</ol>
		{/if}
		{#if form?.programError}
			<p class="error">{form.programError}</p>
		{/if}
	</section>

	<section class="block">
		<h2 class="subtitle">Ajouter une œuvre au programme</h2>
		<form class="search" method="GET" role="search">
			<label class="sr-only" for="q">Chercher une œuvre</label>
			<input
				class="input"
				id="q"
				name="q"
				type="search"
				placeholder="Compositeur, titre, numéro d’opus…"
				value={data.query}
				autocomplete="off"
			/>
			<button class="button secondary" type="submit">Chercher</button>
		</form>
		{#if data.query !== ''}
			{#if data.results.length > 0}
				<form class="add" method="POST" action="?/addItem">
					<fieldset>
						<legend class="sr-only">Œuvre à ajouter</legend>
						{#each data.results as work, index (work.id)}
							<label class="choice">
								<input type="radio" name="workId" value={work.id} checked={index === 0} />
								<span>
									<span class="small muted">{work.composerName}</span>
									<span class="choice-title">{work.title}</span>
								</span>
							</label>
						{/each}
					</fieldset>
					<div class="field">
						<label for="performers">Interprètes pour cette œuvre, si différents</label>
						<input
							class="input"
							id="performers"
							name="performers"
							placeholder="Par exemple le soliste, puis l’orchestre et le chef"
						/>
					</div>
					<button class="button" type="submit">Ajouter au programme</button>
				</form>
			{:else}
				<p class="muted hint">Aucune œuvre trouvée.</p>
			{/if}
		{/if}
	</section>

	<section class="block">
		<h2 class="subtitle">Mes impressions</h2>
		<form
			class="notes"
			method="POST"
			action="?/saveNotes"
			use:enhance={() =>
				({ update }) =>
					update({ reset: false })}
		>
			<label class="sr-only" for="notes">Mes impressions sur ce concert</label>
			<textarea
				class="input"
				id="notes"
				name="notes"
				rows="5"
				placeholder="La salle, l’acoustique, ce qui reste après le concert"
				>{concert.notes ?? ''}</textarea
			>
			{#if form?.notesError}
				<p class="error">{form.notesError}</p>
			{/if}
			<button class="button secondary" type="submit">Enregistrer</button>
		</form>
	</section>

	<details class="danger">
		<summary>Supprimer ce concert</summary>
		<form method="POST" action="?/delete">
			<p class="small muted">
				Le concert, son programme et les notes données aux œuvres de ce soir-là seront supprimés.
			</p>
			<button class="button secondary" type="submit">Supprimer le concert et ses notes</button>
		</form>
	</details>
</div>

<style>
	.back {
		color: var(--ink-soft);
	}

	.hero {
		margin-top: 24px;
	}

	.date {
		display: flex;
		align-items: baseline;
		gap: 12px;
		font-family: var(--font-display);
		font-style: italic;
		font-size: 24px;
		color: var(--accent);
	}

	.badge {
		font-family: var(--font-text);
		font-style: normal;
		font-size: 12px;
		padding: 1px 9px;
		border: 1px solid var(--accent);
		border-radius: 999px;
	}

	.display-title {
		margin-top: 8px;
	}

	.block {
		margin-top: 48px;
	}

	.subtitle {
		font-size: 22px;
	}

	.hint {
		margin-top: 12px;
	}

	.program {
		list-style: none;
		margin: 12px 0 0;
		padding: 0;
	}

	.item {
		display: grid;
		grid-template-columns: 32px minmax(0, 1fr) auto;
		gap: 12px;
		align-items: center;
		padding: 16px 0;
		border-top: 1px solid var(--rule);
	}

	.position {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 22px;
		color: var(--ink-muted);
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.body a {
		font-weight: 600;
		line-height: 1.35;
		text-decoration: none;
	}

	.body a:hover {
		text-decoration: underline;
	}

	.outcome {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.outcome form {
		display: contents;
	}

	.rating {
		font-family: var(--font-display);
		font-size: 32px;
		line-height: 1;
	}

	.todo {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--ink-soft);
	}

	.remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border: 0;
		background: transparent;
		color: var(--ink-muted);
		cursor: pointer;
	}

	.remove:hover {
		color: var(--danger);
	}

	.search {
		display: flex;
		gap: 10px;
		margin-top: 14px;
	}

	.add,
	.notes {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 16px;
	}

	.add .button,
	.notes .button {
		align-self: flex-start;
	}

	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}

	.choice {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 10px 0;
		border-top: 1px solid var(--rule);
		cursor: pointer;
	}

	.choice input {
		width: 20px;
		height: 20px;
		margin: 2px 0 0;
		flex: none;
		accent-color: var(--accent);
	}

	.choice > span {
		display: flex;
		flex-direction: column;
	}

	.choice-title {
		font-weight: 600;
	}

	.danger {
		margin-top: 56px;
	}

	.danger summary {
		cursor: pointer;
		min-height: 44px;
		display: flex;
		align-items: center;
		color: var(--ink-soft);
	}

	.danger form {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}
</style>
