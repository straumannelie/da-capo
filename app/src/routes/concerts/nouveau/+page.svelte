<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let errors = $derived<Record<string, string>>(form?.errors ?? {});
	let values = $derived<Record<string, string>>(form?.values ?? {});
</script>

<svelte:head>
	<title>Ajouter un concert – Da capo</title>
</svelte:head>

<div class="page narrow">
	<a class="small back" href={resolve('/concerts')}>Tous les concerts</a>
	<h1 class="display-title">Ajouter un concert</h1>

	<form method="POST" class="concert-form">
		<div class="row">
			<div class="field date">
				<label for="date">Date</label>
				<input
					class="input"
					id="date"
					name="date"
					type="date"
					value={values['date'] ?? data.today}
					required
				/>
				{#if errors['date']}<p class="error">{errors['date']}</p>{/if}
			</div>
			<div class="field grow">
				<label for="venue">Salle</label>
				<input class="input" id="venue" name="venue" value={values['venue'] ?? ''} required />
				{#if errors['venue']}<p class="error">{errors['venue']}</p>{/if}
			</div>
		</div>

		<div class="field">
			<label for="title">Titre du concert, facultatif</label>
			<input class="input" id="title" name="title" value={values['title'] ?? ''} />
			{#if errors['title']}<p class="error">{errors['title']}</p>{/if}
		</div>

		<div class="field">
			<label for="performers">Interprètes</label>
			<input
				class="input"
				id="performers"
				name="performers"
				placeholder="Orchestre, chef"
				aria-describedby="performers-hint"
				value={values['performers'] ?? ''}
				required
			/>
			<p class="small muted" id="performers-hint">
				Repris pour chaque œuvre du programme. Tu pourras préciser un soliste œuvre par œuvre.
			</p>
			{#if errors['performers']}<p class="error">{errors['performers']}</p>{/if}
		</div>

		<div class="field">
			<label for="notes">Notes, facultatif</label>
			<textarea class="input" id="notes" name="notes" rows="3">{values['notes'] ?? ''}</textarea>
		</div>

		<button class="button submit" type="submit">Créer le concert</button>
	</form>
</div>

<style>
	.back {
		color: var(--ink-soft);
	}

	.display-title {
		margin-top: 20px;
	}

	.concert-form {
		display: flex;
		flex-direction: column;
		gap: 22px;
		margin-top: 32px;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
	}

	.date {
		flex: 1 1 180px;
	}

	.grow {
		flex: 3 1 260px;
	}

	.submit {
		align-self: flex-start;
		min-height: 52px;
	}
</style>
