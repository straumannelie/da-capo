<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import NoteHead from '#lib/components/NoteHead.svelte';
	import RatingPicker from '#lib/components/RatingPicker.svelte';
	import { toRoman } from '#lib/domain/moments.ts';
	import { periodOf } from '#lib/domain/periods.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let errors = $derived<Record<string, string>>(form?.errors ?? {});
	let values = $derived<Record<string, string>>(form?.values ?? {});
	let submitting = $state(false);

	let initialRecording = $derived(
		data.mode === 'form'
			? (values['recording'] ??
					(data.work.selectedRecordingId === null ? 'new' : String(data.work.selectedRecordingId)))
			: 'new'
	);
	let initialRating = $derived.by(() => {
		const previous = Number(values['rating']);
		return Number.isInteger(previous) && previous > 0 ? previous : null;
	});
	let recording = $derived(initialRecording);
	let rating = $derived(initialRating);

	let workHref = (id: number) => resolve(`/ecoute?oeuvre=${id}`);
</script>

<svelte:head>
	<title>Noter une écoute – Da capo</title>
</svelte:head>

<div class="page narrow">
	<h1 class="display-title">Noter une écoute</h1>

	{#if data.mode === 'search'}
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
				<ul class="ruled works">
					{#each data.results as work (work.id)}
						<li>
							<a class="work" href={workHref(work.id)}>
								<NoteHead color={periodOf(work.epoch, work.birthYear).color} filled={false} />
								<span class="work-body">
									<span class="small muted">{work.composerName}</span>
									<span class="title">{work.title}</span>
								</span>
							</a>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="muted hint">
					Aucune œuvre trouvée. Essaie le nom du compositeur suivi d’un mot du titre.
				</p>
			{/if}
		{:else}
			{#each [{ label: 'Dans ma file', items: data.queue }, { label: 'Écoutées récemment', items: data.recent }] as group (group.label)}
				{#if group.items.length > 0}
					<h2 class="group-title">{group.label}</h2>
					<ul class="ruled works">
						{#each group.items as work (work.id)}
							<li>
								<a class="work" href={workHref(work.id)}>
									<NoteHead
										color={periodOf(work.epoch, work.birthYear).color}
										filled={group.label !== 'Dans ma file'}
									/>
									<span class="work-body">
										<span class="small muted">{work.composerName}</span>
										<span class="title">{work.title}</span>
									</span>
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			{/each}
		{/if}
	{:else}
		<form
			class="listen-form"
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update({ reset: false });
					submitting = false;
				};
			}}
		>
			<input type="hidden" name="workId" value={data.work.id} />
			{#if data.returnTo}
				<input type="hidden" name="suite" value={data.returnTo} />
			{/if}

			<div class="field">
				<span class="label">Œuvre</span>
				<div class="chosen">
					<span class="work-body">
						<span class="small muted">{data.work.composer.completeName}</span>
						<span class="title">{data.work.title}</span>
					</span>
					<a class="small" href={resolve('/ecoute')}>Changer</a>
				</div>
			</div>

			<fieldset class="versions">
				<legend>Version</legend>
				{#each data.work.recordings as option (option.id)}
					<label class="choice">
						<input type="radio" name="recording" value={String(option.id)} bind:group={recording} />
						<span>
							{option.performers}{option.year === null ? '' : `, ${option.year}`}
							{#if option.isReference}
								<span class="small accent">Ma référence</span>
							{/if}
						</span>
					</label>
				{/each}
				<label class="choice">
					<input type="radio" name="recording" value="new" bind:group={recording} />
					<span>Une nouvelle version</span>
				</label>
				{#if errors['recording']}
					<p class="error">{errors['recording']}</p>
				{/if}

				{#if recording === 'new'}
					<div class="new-version">
						<div class="field">
							<label for="performers">Interprètes</label>
							<input
								class="input"
								id="performers"
								name="performers"
								placeholder="Soliste, orchestre, chef"
								value={values['performers'] ?? ''}
							/>
							{#if errors['performers']}
								<p class="error">{errors['performers']}</p>
							{/if}
						</div>
						<div class="field year">
							<label for="year">Année</label>
							<input
								class="input"
								id="year"
								name="year"
								inputmode="numeric"
								value={values['year'] ?? ''}
							/>
							{#if errors['year']}
								<p class="error">{errors['year']}</p>
							{/if}
						</div>
					</div>
				{/if}
			</fieldset>

			<div class="field date">
				<label for="listenedOn">Date</label>
				<input
					class="input"
					id="listenedOn"
					name="listenedOn"
					type="date"
					value={values['listenedOn'] ?? data.defaultDate}
					required
				/>
				{#if errors['listenedOn']}
					<p class="error">{errors['listenedOn']}</p>
				{/if}
			</div>

			<div>
				<RatingPicker bind:value={rating} />
				{#if errors['rating']}
					<p class="error">{errors['rating']}</p>
				{/if}
			</div>

			{#if data.work.movements.length > 0}
				<details class="panel">
					<summary>Noter aussi chaque mouvement</summary>
					<div class="movement-grid">
						{#each data.work.movements as movement, index (index)}
							<label class="movement" for="movement-{index}">
								<span>{toRoman(index + 1)}. {movement}</span>
								<input
									class="input"
									id="movement-{index}"
									name="movementRating"
									type="number"
									min="1"
									max="10"
									inputmode="numeric"
								/>
							</label>
						{/each}
					</div>
					{#if errors['movementRatings']}
						<p class="error">{errors['movementRatings']}</p>
					{/if}
				</details>
			{/if}

			<div class="field">
				<label for="notes">Ce que j’ai entendu</label>
				<textarea
					class="input"
					id="notes"
					name="notes"
					rows="4"
					placeholder="Ce qui m’a marqué, ce que je veux réécouter"
					>{values['notes'] ?? ''}</textarea
				>
				{#if errors['notes']}
					<p class="error">{errors['notes']}</p>
				{/if}
			</div>

			<div class="field">
				<label for="moments">Moments</label>
				<textarea
					class="input"
					id="moments"
					name="moments"
					rows="3"
					aria-describedby="moments-hint"
					placeholder="II 7:10 Dialogue avec les bois">{values['moments'] ?? ''}</textarea
				>
				<p class="small muted" id="moments-hint">
					Un par ligne : le mouvement en chiffres romains, le minutage, puis ta note.
				</p>
			</div>

			<button class="button submit" type="submit" disabled={submitting}>
				{submitting ? 'Enregistrement…' : 'Enregistrer l’écoute'}
			</button>
		</form>
	{/if}
</div>

<style>
	.search {
		display: flex;
		gap: 10px;
		margin-top: 28px;
	}

	.group-title {
		margin-top: 36px;
		font-size: 24px;
	}

	.works {
		margin-top: 12px;
	}

	.work {
		display: flex;
		gap: 14px;
		align-items: baseline;
		min-height: 56px;
		padding: 12px 0;
		text-decoration: none;
	}

	.work-body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.title {
		font-weight: 600;
		line-height: 1.35;
	}

	.work:hover .title {
		text-decoration: underline;
	}

	.hint {
		margin-top: 20px;
	}

	.listen-form {
		display: flex;
		flex-direction: column;
		gap: 24px;
		margin-top: 28px;
	}

	.chosen {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 12px 14px;
		border: 1px solid var(--field-border);
		border-radius: var(--radius);
		background: var(--paper-raised);
	}

	.versions {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}

	.versions legend {
		margin-bottom: 6px;
	}

	.choice {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 44px;
		cursor: pointer;
	}

	.choice input {
		width: 20px;
		height: 20px;
		margin: 0;
		accent-color: var(--accent);
	}

	.accent {
		margin-left: 8px;
		color: var(--accent);
	}

	.new-version {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 8px;
	}

	.new-version .field:first-child {
		flex: 3 1 240px;
	}

	.year {
		flex: 1 1 100px;
	}

	.date {
		max-width: 240px;
	}

	.panel summary {
		cursor: pointer;
		min-height: 44px;
		display: flex;
		align-items: center;
		color: var(--ink-soft);
	}

	.movement-grid {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-top: 8px;
	}

	.movement {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 88px;
		gap: 12px;
		align-items: center;
		font-size: 15px;
	}

	.submit {
		min-height: 54px;
		font-size: 16px;
	}

	.submit:disabled {
		opacity: 0.6;
		cursor: progress;
	}
</style>
