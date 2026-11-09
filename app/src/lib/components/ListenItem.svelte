<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatShortDate } from '#lib/domain/format.ts';
	import { periodOf } from '#lib/domain/periods.ts';
	import type { ListenListItem } from '#lib/server/repo/listens.ts';

	let {
		listen,
		currentYear,
		showNotes = false
	}: { listen: ListenListItem; currentYear: number; showNotes?: boolean } = $props();
</script>

<article class="listen">
	<span class="rating" style:color={periodOf(listen.epoch, listen.birthYear).color}>
		{listen.rating}<span class="sr-only"> sur 10</span>
	</span>
	<div class="body">
		<span class="meta"
			>{listen.composerName}, {formatShortDate(listen.listenedOn, currentYear)}{listen.concertId ===
			null
				? ''
				: ', en concert'}</span
		>
		<a
			class="work"
			href={resolve(`/oeuvres/[id]?version=${listen.recordingId}`, { id: String(listen.workId) })}
			>{listen.workTitle}</a
		>
		<span class="performers">{listen.performers}</span>
		{#if showNotes && listen.notes}
			<p class="notes">{listen.notes}</p>
		{/if}
	</div>
</article>

<style>
	.listen {
		display: flex;
		gap: 18px;
		align-items: baseline;
		padding: 16px 0;
	}

	.rating {
		min-width: 34px;
		font-family: var(--font-display);
		font-size: 36px;
		line-height: 1;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.meta {
		font-size: 13px;
		color: var(--ink-muted);
	}

	.work {
		font-weight: 600;
		font-size: 15px;
		line-height: 1.35;
		text-decoration: none;
	}

	.work:hover {
		text-decoration: underline;
	}

	.performers {
		font-size: 14px;
		color: var(--ink-soft);
	}

	.notes {
		margin-top: 8px;
		max-width: 66ch;
		font-size: 15px;
		line-height: 1.6;
		white-space: pre-line;
	}
</style>
