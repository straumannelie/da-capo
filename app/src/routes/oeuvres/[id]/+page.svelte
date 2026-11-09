<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { countLabel, formatDate, formatShortDate } from '#lib/domain/format.ts';
	import { genreLabel } from '#lib/domain/labels.ts';
	import { momentLabel, toRoman } from '#lib/domain/moments.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let work = $derived(data.work);
	let selected = $derived(
		work.recordings.find((recording) => recording.id === work.selectedRecordingId) ?? null
	);
	let unheard = $derived(
		work.recordings.filter((recording) => recording.summary.listenCount === 0).length
	);
	let movementCount = $derived(work.movements.length);
	let listenHref = $derived(
		selected
			? resolve(`/ecoute?oeuvre=${work.id}&version=${selected.id}`)
			: resolve(`/ecoute?oeuvre=${work.id}`)
	);
	let versionHref = (id: number) => resolve(`/oeuvres/[id]?version=${id}`, { id: String(work.id) });
	let movementScores = (ratings: readonly (number | null)[]) =>
		work.movements.map((_, index) => ratings[index] ?? null);
</script>

<svelte:head>
	<title>{work.title} – Da capo</title>
</svelte:head>

<div class="page">
	<a class="back small" href={resolve('/compositeurs/[id]', { id: String(work.composer.id) })}
		>{work.composer.completeName}</a
	>

	<header class="hero">
		<h1 class="display-title">{work.title}</h1>
		{#if work.originalTitle !== work.title}
			<p class="original">{work.originalTitle}</p>
		{/if}
		{#if work.subtitle}
			<p class="muted">{work.subtitle}</p>
		{/if}
	</header>

	<div class="facts">
		<dl>
			{#if work.genre}
				<div>
					<dt>Genre</dt>
					<dd>{genreLabel(work.genre)}</dd>
				</div>
			{/if}
			<div>
				<dt>Mouvements</dt>
				<dd>
					{#if movementCount > 0}
						<ol class="movements">
							{#each work.movements as movement, index (index)}
								<li>{toRoman(index + 1)}. {movement}</li>
							{/each}
						</ol>
					{:else}
						<span class="muted">Non renseignés</span>
					{/if}
				</dd>
			</div>
		</dl>
		<div class="actions">
			<a class="button" href={listenHref}>Noter une écoute</a>
			<form method="POST" action="?/toggleWatchlist" use:enhance>
				<input type="hidden" name="watchlisted" value={String(!work.inWatchlist)} />
				<button class="button secondary" type="submit">
					{work.inWatchlist ? 'Retirer de ma file' : 'Ajouter à ma file'}
				</button>
			</form>
		</div>
	</div>

	<details class="panel">
		<summary>Modifier les mouvements</summary>
		<form
			method="POST"
			action="?/saveMovements"
			use:enhance={() =>
				({ update }) =>
					update({ reset: false })}
		>
			<div class="field">
				<label for="movements">Un mouvement par ligne</label>
				<textarea class="input" id="movements" name="movements" rows="5"
					>{work.movements.join('\n')}</textarea
				>
			</div>
			{#if form?.movementErrors?.['movements']}
				<p class="error">{form.movementErrors['movements']}</p>
			{/if}
			<button class="button secondary" type="submit">Enregistrer les mouvements</button>
		</form>
	</details>

	<section class="versions">
		<div class="versions-header">
			<h2 class="section-title">Versions</h2>
			<span class="muted">
				{countLabel(work.listenCount, 'écoute', 'écoutes')}, {countLabel(
					work.recordings.length,
					'version',
					'versions'
				)}{unheard > 0 ? `, ${unheard} à découvrir` : ''}
			</span>
		</div>

		{#if work.recordings.length > 0}
			<div class="scroller">
				<div class="table" class:with-movements={movementCount > 0}>
					<div class="row head" aria-hidden="true">
						<span>Interprètes</span>
						<span>Année</span>
						{#if movementCount > 0}
							<span>Par mouvement</span>
						{/if}
						<span>Écoutes</span>
						<span class="right">Ma note</span>
					</div>
					<ul class="rows">
						{#each work.recordings as recording (recording.id)}
							<li>
								<a
									class="row version"
									class:selected={recording.id === selected?.id}
									href={versionHref(recording.id)}
									aria-current={recording.id === selected?.id ? 'true' : undefined}
									data-sveltekit-noscroll
									data-sveltekit-replacestate
								>
									<span class="performers">
										<span class="who">{recording.performers}</span>
										{#if recording.isReference}
											<span class="pill">Ma référence</span>
										{/if}
										{#if recording.concert}
											<span class="live small"
												>En concert le {formatShortDate(recording.concert.date, 0)}, {recording
													.concert.venue}</span
											>
										{/if}
									</span>
									<span>{recording.year ?? '–'}</span>
									{#if movementCount > 0}
										<span class="by-movement">
											{#each movementScores(recording.summary.latestMovementRatings) as value, index (index)}
												<span>{value ?? '–'}</span>
											{/each}
										</span>
									{/if}
									<span class="muted">
										{recording.summary.listenCount === 0
											? 'aucune'
											: countLabel(recording.summary.listenCount, 'écoute', 'écoutes')}
									</span>
									<span class="right score" class:pending={recording.summary.latestRating === null}>
										{recording.summary.latestRating ?? 'À écouter'}
									</span>
								</a>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{:else}
			<p class="muted empty">
				Aucune version pour l’instant. Ajoute celle que tu écoutes, ou note directement une écoute.
			</p>
		{/if}

		<details class="panel">
			<summary>Ajouter une version</summary>
			<form method="POST" action="?/addRecording" use:enhance>
				<div class="field">
					<label for="performers">Interprètes</label>
					<input
						class="input"
						id="performers"
						name="performers"
						placeholder="Soliste, orchestre, chef"
						required
					/>
					{#if form?.recordingErrors?.['performers']}
						<p class="error">{form.recordingErrors['performers']}</p>
					{/if}
				</div>
				<div class="field year">
					<label for="year">Année d’enregistrement</label>
					<input class="input" id="year" name="year" inputmode="numeric" />
					{#if form?.recordingErrors?.['year']}
						<p class="error">{form.recordingErrors['year']}</p>
					{/if}
				</div>
				<button class="button secondary" type="submit">Ajouter la version</button>
			</form>
		</details>
	</section>

	{#if selected}
		<section class="entries">
			<div class="entries-header">
				<div>
					<h3 class="entries-title">Mes écoutes de {selected.performers}</h3>
					{#if selected.concert}
						<a class="small" href={resolve('/concerts/[id]', { id: String(selected.concert.id) })}
							>Voir le concert du {formatDate(selected.concert.date)}</a
						>
					{/if}
				</div>
				<form method="POST" action="?/setReference" use:enhance>
					<input type="hidden" name="recordingId" value={selected.id} />
					<button class="button quiet" type="submit">
						{selected.isReference ? 'Ne plus en faire ma référence' : 'En faire ma référence'}
					</button>
				</form>
			</div>

			{#if work.entries.length > 0}
				<ol class="ruled">
					{#each work.entries as entry (entry.id)}
						<li class="entry">
							<p class="entry-head">
								<span class="entry-rating">{entry.rating}<span class="out-of">/10</span></span>
								<span class="muted">{formatDate(entry.listenedOn)}</span>
							</p>
							{#if entry.notes}
								<p class="entry-notes">{entry.notes}</p>
							{/if}
							{#if entry.moments.length > 0}
								<ul class="moments">
									{#each entry.moments as moment, index (index)}
										<li>
											<span class="moment-at">{momentLabel(moment)}</span>
											<span class="muted">{moment.note}</span>
										</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ol>
			{:else}
				<div class="pending-entry">
					<p class="muted">Pas encore écoutée.</p>
					<a class="button" href={listenHref}>Noter une écoute</a>
				</div>
			{/if}
		</section>
	{/if}
</div>

<style>
	.back {
		color: var(--ink-soft);
	}

	.hero {
		margin-top: 24px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-width: 900px;
	}

	.original {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 22px;
		color: var(--accent);
	}

	.facts {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 24px 40px;
		margin-top: 36px;
	}

	dl {
		display: flex;
		flex-wrap: wrap;
		gap: 16px 48px;
		margin: 0;
	}

	dt {
		font-size: 13px;
		color: var(--ink-muted);
	}

	dd {
		margin: 4px 0 0;
	}

	.movements {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.panel {
		margin-top: 24px;
		max-width: 620px;
	}

	.panel summary {
		cursor: pointer;
		min-height: 44px;
		display: flex;
		align-items: center;
		color: var(--ink-soft);
	}

	.panel form {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 8px 0 16px;
	}

	.panel form .button {
		align-self: flex-start;
	}

	.year {
		max-width: 220px;
	}

	.versions {
		margin-top: 56px;
	}

	.versions-header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px 24px;
	}

	.scroller {
		margin-top: 20px;
		overflow-x: auto;
	}

	.table {
		min-width: 640px;
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 72px 96px 96px;
		gap: 16px;
		align-items: center;
		padding: 0 20px;
	}

	.with-movements .row {
		grid-template-columns: minmax(0, 1fr) 72px 130px 96px 96px;
	}

	.head {
		padding-bottom: 10px;
		font-size: 13px;
		color: var(--ink-muted);
	}

	.version {
		min-height: 72px;
		padding-block: 14px;
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		background: var(--paper-raised);
		text-decoration: none;
		color: var(--ink);
	}

	.version:hover {
		color: var(--ink);
		border-color: var(--rule-strong);
	}

	.version.selected {
		border-color: var(--accent);
		background: var(--accent-tint);
	}

	.performers {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 10px;
		min-width: 0;
	}

	.who {
		font-weight: 600;
	}

	.live {
		flex-basis: 100%;
		color: var(--ink-soft);
	}

	.pill {
		padding: 1px 9px;
		border: 1px solid var(--accent);
		border-radius: 999px;
		font-size: 12px;
		color: var(--accent);
	}

	.by-movement {
		display: flex;
		gap: 14px;
		color: var(--ink-soft);
	}

	.right {
		text-align: right;
	}

	.score {
		font-family: var(--font-display);
		font-size: 32px;
		line-height: 1;
	}

	.score.pending {
		font-family: var(--font-text);
		font-size: 14px;
		color: var(--ink-muted);
	}

	.empty {
		margin-top: 16px;
	}

	.entries {
		margin-top: 48px;
		max-width: 820px;
	}

	.entries-header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px 24px;
		margin-bottom: 16px;
	}

	.entries-title {
		font-size: 26px;
	}

	.entry {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 20px 0;
	}

	.entry-head {
		display: flex;
		align-items: baseline;
		gap: 14px;
	}

	.entry-rating {
		font-family: var(--font-display);
		font-size: 26px;
		line-height: 1;
	}

	.out-of {
		font-size: 15px;
		color: var(--ink-muted);
	}

	.entry-notes {
		max-width: 66ch;
		font-size: 17px;
		line-height: 1.65;
		white-space: pre-line;
	}

	.moments {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.moments li {
		display: flex;
		gap: 14px;
		align-items: baseline;
		font-size: 15px;
	}

	.moment-at {
		flex: none;
		min-width: 72px;
		font-weight: 600;
		color: var(--accent);
	}

	.pending-entry {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px 24px;
		padding: 24px 0;
		border-top: 1px solid var(--rule);
	}
</style>
