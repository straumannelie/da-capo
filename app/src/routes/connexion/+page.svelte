<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Connexion – Da capo</title>
</svelte:head>

<div class="login">
	<p class="wordmark">Da capo</p>
	<form method="POST">
		<div class="field">
			<label for="password">Mot de passe</label>
			<input
				class="input"
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
				aria-invalid={form?.error ? 'true' : undefined}
				aria-describedby={form?.error ? 'password-error' : undefined}
			/>
			{#if form?.error}
				<p class="error" id="password-error">{form.error}</p>
			{/if}
		</div>
		<button class="button" type="submit">Se connecter</button>
	</form>
</div>

<style>
	.login {
		display: flex;
		flex-direction: column;
		gap: 32px;
		max-width: 360px;
		margin: 0 auto;
		padding: calc(18vh + env(safe-area-inset-top, 0px)) 24px 48px;
	}

	.wordmark {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 56px;
		line-height: 1;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
