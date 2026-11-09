<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>{page.status} – Da capo</title>
</svelte:head>

<div class="page narrow">
	<p class="status">{page.status}</p>
	<h1 class="display-title">
		{page.status === 404 ? 'Cette page n’existe pas.' : 'Quelque chose s’est mal passé.'}
	</h1>
	{#if page.error?.message && page.status !== 404}
		<p class="lede">{page.error.message}</p>
	{/if}
	<a class="button secondary back" href={resolve('/')}>Revenir à la frise</a>
</div>

<style>
	.status {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 28px;
		color: var(--accent);
	}

	.back {
		margin-top: 32px;
	}
</style>
