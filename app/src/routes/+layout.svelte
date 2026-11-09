<script lang="ts">
	import '@fontsource-variable/bodoni-moda/opsz.css';
	import '@fontsource-variable/bodoni-moda/opsz-italic.css';
	import '@fontsource-variable/hanken-grotesk';
	import '../app.css';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const sections = [
		{ href: resolve('/'), label: 'Frise', match: (path: string) => path === '/' },
		{
			href: resolve('/compositeurs'),
			label: 'Compositeurs',
			match: (path: string) => path.startsWith('/compositeurs') || path.startsWith('/oeuvres')
		},
		{
			href: resolve('/concerts'),
			label: 'Concerts',
			match: (path: string) => path.startsWith('/concerts')
		},
		{
			href: resolve('/journal'),
			label: 'Journal',
			match: (path: string) => path.startsWith('/journal')
		},
		{
			href: resolve('/statistiques'),
			label: 'Statistiques',
			match: (path: string) => path.startsWith('/statistiques')
		}
	];

	let bare = $derived(page.url.pathname === '/connexion');
</script>

<svelte:head>
	<title>Da capo</title>
</svelte:head>

{#if !bare}
	<header class="site-header">
		<a class="wordmark" href={resolve('/')}>Da capo</a>
		<nav aria-label="Sections">
			{#each sections as section (section.href)}
				<a href={section.href} aria-current={section.match(page.url.pathname) ? 'page' : undefined}
					>{section.label}</a
				>
			{/each}
		</nav>
		<div class="actions">
			<a class="button" href={resolve('/ecoute')}>Noter une écoute</a>
			{#if data.authEnabled}
				<form method="POST" action={resolve('/deconnexion')}>
					<button class="button quiet" type="submit">Se déconnecter</button>
				</form>
			{/if}
		</div>
	</header>
{/if}

<main>
	{@render children()}
</main>

<style>
	.site-header {
		max-width: var(--page-width);
		margin: 0 auto;
		padding: calc(24px + env(safe-area-inset-top, 0px)) var(--gutter) 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px 40px;
	}

	.wordmark {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 30px;
		font-weight: 500;
		letter-spacing: -0.01em;
		text-decoration: none;
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 28px;
		flex: 1 1 auto;
		font-size: 15px;
	}

	nav a {
		padding: 10px 0;
		color: var(--ink-soft);
		text-decoration: none;
		border-bottom: 2px solid transparent;
	}

	nav a[aria-current='page'] {
		color: var(--ink);
		font-weight: 600;
		border-bottom-color: var(--accent);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.actions form {
		display: contents;
	}
</style>
