<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import LifeLine from '#lib/components/LifeLine.svelte';
	import NoteHead from '#lib/components/NoteHead.svelte';
	import { countLabel, lifeEvent, lifeYears } from '#lib/domain/format.ts';
	import { genreLabel } from '#lib/domain/labels.ts';
	import { epochLabel, periodOf } from '#lib/domain/periods.ts';
	import { buildTimeline } from '#lib/domain/timeline.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let composer = $derived(data.composer);
	let period = $derived(periodOf(composer.epoch, composer.birthYear));
	let circle = $derived(buildTimeline(composer.circle, data.currentYear));
	let born = $derived(lifeEvent(composer.birthYear, composer.birthPlace));
	let died = $derived(lifeEvent(composer.deathYear, composer.deathPlace));
	let workHref = (id: number) => resolve('/oeuvres/[id]', { id: String(id) });
</script>

<svelte:head>
	<title>{composer.completeName} – Da capo</title>
</svelte:head>

<div class="page">
	<a class="back small" href={resolve('/')}>Retour à la frise</a>

	<header class="hero">
		<span class="epoch" style:color={period.color}>{epochLabel(composer.epoch)}</span>
		<h1 class="name">{composer.completeName}</h1>
		<div class="facts">
			<dl>
				{#if born}
					<div>
						<dt>Naissance</dt>
						<dd>{born}</dd>
					</div>
				{/if}
				{#if died}
					<div>
						<dt>Mort</dt>
						<dd>{died}</dd>
					</div>
				{/if}
			</dl>
			<form method="POST" action="?/follow" use:enhance>
				<input type="hidden" name="followed" value={String(!composer.followed)} />
				<button class="button secondary" type="submit">
					{composer.followed ? 'Retirer de la frise' : 'Suivre sur la frise'}
				</button>
			</form>
		</div>
	</header>

	<div class="layout">
		<div class="main">
			<section>
				<h2 class="section-title">Sa vie</h2>
				{#if composer.bio}
					<p class="bio">{composer.bio}</p>
					{#if composer.bioUrl}
						<p class="small muted source">
							Résumé tiré de <a href={composer.bioUrl} rel="external noopener">Wikipédia</a>
						</p>
					{/if}
				{:else}
					<p class="bio muted">Pas encore de biographie pour ce compositeur.</p>
				{/if}
			</section>

			{#if circle.rows.length > 0}
				<section>
					<h2 class="section-title">Ses proches</h2>
					<p class="muted intro">Maîtres, élèves et influences, chacun sur sa ligne de vie.</p>
					<div class="scroller">
						<div class="circle">
							<ol class="ruled">
								{#each circle.rows as member (member.id)}
									<li class="member">
										<span class="who">
											{#if member.isSelf}
												<span class="self">{member.completeName}</span>
											{:else}
												<a href={resolve('/compositeurs/[id]', { id: String(member.id) })}
													>{member.completeName}</a
												>
											{/if}
											<span class="small muted"
												>{member.relation}, {lifeYears(member.birthYear, member.deathYear)}</span
											>
										</span>
										<span class="track" aria-hidden="true">
											<LifeLine placement={member} listened={member.listened} />
										</span>
									</li>
								{/each}
							</ol>
							<div class="axis" aria-hidden="true">
								<span></span>
								<span class="ticks">
									{#each circle.ticks as tick (tick.year)}
										<span class="tick" style:left="{tick.left}%">{tick.year}</span>
									{/each}
								</span>
							</div>
						</div>
					</div>
				</section>
			{/if}
		</div>

		<section class="works">
			<h2 class="section-title">Œuvres phares</h2>
			{#if composer.coverage.total > 0}
				<p class="muted">{composer.coverage.listened} sur {composer.coverage.total} écoutées</p>
				<div class="progress" aria-hidden="true">
					<span style:width="{composer.coverage.ratio * 100}%"></span>
				</div>
			{/if}
			<ol class="ruled">
				{#each composer.works as work (work.id)}
					<li class="work">
						<span class="work-body">
							<a href={workHref(work.id)}>{work.title}</a>
							{#if work.genre}
								<span class="small muted">{genreLabel(work.genre)}</span>
							{/if}
						</span>
						{#if work.rating !== null}
							<span class="score">
								<span class="rating">{work.rating}<span class="sr-only"> sur 10</span></span>
								<span class="small muted">{countLabel(work.listenCount, 'écoute', 'écoutes')}</span>
							</span>
						{:else}
							<span class="todo small">
								<NoteHead color={period.color} filled={false} />
								À écouter
							</span>
						{/if}
					</li>
				{/each}
			</ol>

			<h3 class="others-title">Autres œuvres</h3>
			<form class="search" method="GET" role="search">
				<label class="sr-only" for="q">Chercher dans ses œuvres</label>
				<input
					class="input"
					id="q"
					name="q"
					type="search"
					placeholder="Chercher dans ses œuvres"
					value={data.query}
					autocomplete="off"
				/>
				<button class="button secondary" type="submit">Chercher</button>
			</form>
			{#if data.otherWorks.length > 0}
				<ul class="ruled others">
					{#each data.otherWorks as work (work.id)}
						<li><a href={workHref(work.id)}>{work.title}</a></li>
					{/each}
				</ul>
			{:else}
				<p class="small muted others-empty">
					{data.query === '' ? 'Pas d’autre œuvre recommandée.' : 'Aucune œuvre trouvée.'}
				</p>
			{/if}
			<p class="small muted source">Catalogue : Open Opus. Liens et lieux : Wikidata.</p>
		</section>
	</div>
</div>

<style>
	.back {
		color: var(--ink-soft);
	}

	.hero {
		margin-top: 28px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.epoch {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 24px;
	}

	.name {
		font-size: clamp(48px, 9vw, 96px);
		line-height: 0.98;
		letter-spacing: -0.025em;
	}

	.facts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 16px 32px;
		margin-top: 16px;
	}

	dl {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 40px;
		margin: 0;
	}

	dt {
		font-size: 13px;
		color: var(--ink-muted);
	}

	dd {
		margin: 0;
		font-size: 17px;
	}

	.layout {
		display: flex;
		flex-wrap: wrap;
		gap: 64px;
		margin-top: 56px;
		align-items: flex-start;
	}

	.main {
		flex: 3 1 560px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 56px;
	}

	.bio {
		margin-top: 14px;
		max-width: 66ch;
		font-size: 17px;
		line-height: 1.7;
	}

	.source {
		margin-top: 14px;
	}

	.intro {
		margin: 6px 0 20px;
		font-size: 15px;
	}

	.scroller {
		overflow-x: auto;
	}

	.circle {
		min-width: 600px;
	}

	.member,
	.axis {
		display: grid;
		grid-template-columns: 220px minmax(0, 1fr);
		align-items: center;
	}

	.member {
		min-height: 54px;
	}

	.who {
		display: flex;
		flex-direction: column;
		padding: 6px 16px 6px 0;
	}

	.who a,
	.self {
		font-weight: 600;
		font-size: 15px;
		text-decoration: none;
	}

	.self {
		color: var(--accent);
	}

	.track {
		position: relative;
		height: 26px;
		background-image: repeating-linear-gradient(
			to bottom,
			transparent 0 12px,
			var(--staff) 12px 13px
		);
	}

	.ticks {
		position: relative;
		height: 32px;
		border-top: 1px solid var(--rule-strong);
	}

	.tick {
		position: absolute;
		top: 6px;
		transform: translateX(-50%);
		font-size: 12px;
		color: var(--ink-muted);
	}

	.works {
		flex: 2 1 360px;
		min-width: 0;
	}

	.works > p.muted:first-of-type {
		margin-top: 6px;
	}

	.progress {
		height: 4px;
		margin: 12px 0 20px;
		border-radius: 2px;
		background: var(--rule);
	}

	.progress span {
		display: block;
		height: 4px;
		border-radius: 2px;
		background: var(--accent);
	}

	.work {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 16px 0;
	}

	.work-body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.work-body a {
		font-weight: 600;
		line-height: 1.35;
		text-decoration: none;
	}

	.work-body a:hover {
		text-decoration: underline;
	}

	.score {
		flex: none;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.rating {
		font-family: var(--font-display);
		font-size: 32px;
		line-height: 1;
	}

	.todo {
		flex: none;
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--ink-soft);
	}

	.others-title {
		margin-top: 40px;
		font-size: 22px;
	}

	.search {
		display: flex;
		gap: 10px;
		margin-top: 14px;
	}

	.others {
		margin-top: 16px;
	}

	.others li {
		padding: 10px 0;
		font-size: 15px;
	}

	.others-empty {
		margin-top: 14px;
	}
</style>
