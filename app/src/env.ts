import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

const optionalText = (value: string | undefined): string | undefined =>
	value === undefined || value.trim() === '' ? undefined : value.trim();

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'URL Postgres (Supabase en production). Vide en local : PGlite est utilisé.',
		schema: (value) => {
			const url = optionalText(value);
			return url === undefined ? undefined : z.url({ protocol: /^postgres(ql)?$/ }).parse(url);
		}
	},
	PGLITE_DIR: {
		description: 'Dossier de la base PGlite locale, utilisé quand DATABASE_URL est vide.',
		schema: (value) => optionalText(value) ?? '.data/pglite'
	},
	APP_PASSWORD: {
		description: 'Mot de passe de connexion. Obligatoire hors développement.',
		schema: (value) => {
			const password = optionalText(value);
			if (password !== undefined && password.length < 12) {
				throw new Error('APP_PASSWORD doit faire au moins 12 caractères.');
			}
			return password;
		}
	},
	SESSION_SECRET: {
		description: 'Secret de signature du cookie de session (32 caractères minimum).',
		schema: (value) => {
			const secret = optionalText(value);
			if (secret !== undefined && secret.length < 32) {
				throw new Error('SESSION_SECRET doit faire au moins 32 caractères.');
			}
			return secret;
		}
	}
});
