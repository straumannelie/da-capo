<script lang="ts">
	import { resolve } from '$app/paths';
	import ListenItem from '#lib/components/ListenItem.svelte';
	import { countLabel } from '#lib/domain/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let journal = $derived(data.journal);
	let pageHref = (page: number) => resolve(`/journal?page=${page}`);
</script>

<svelte:head>
	<title>Journal – Da capo</title>
</svelte:head>

<div class="page narrow">
	<h1 class="display-title">Journal</h1>
	<p class="lede">{countLabel(journal.total, 'écoute notée', 'écoutes notées')}</p>

	{#if journal.items.length > 0}
		<ol class="ruled entries">
			{#each journal.items as listen (listen.id)}
				<li><ListenItem {listen} currentYear={data.currentYear} showNotes /></li>
			{/each}
		</ol>
	{:else}
		<p class="empty">
			Ton journal est vide. <a href={resolve('/ecoute')}>Note ta première écoute.</a>
		</p>
	{/if}

	{#if journal.pageCount > 1}
		<nav class="pagination" aria-label="Pages du journal">
			{#if journal.page > 1}
				<a href={pageHref(journal.page - 1)}>Plus récentes</a>
			{/if}
			<span class="muted">Page {journal.page} sur {journal.pageCount}</span>
			{#if journal.page < journal.pageCount}
				<a href={pageHref(journal.page + 1)}>Plus anciennes</a>
			{/if}
		</nav>
	{/if}
</div>

<style>
	.entries {
		margin-top: 32px;
	}

	.empty {
		margin-top: 32px;
		color: var(--ink-soft);
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-top: 32px;
		padding-top: 16px;
		border-top: 1px solid var(--rule);
	}

	.pagination a {
		min-height: 44px;
		display: inline-flex;
		align-items: center;
	}
</style>
