import { mkdirSync } from 'node:fs';
import { connect, type DatabaseHandle } from '#lib/server/db/client.ts';

function optional(name: string): string | undefined {
	const value = process.env[name]?.trim();
	return value === undefined || value === '' ? undefined : value;
}

export function connectFromEnv(): Promise<DatabaseHandle> {
	const databaseUrl = optional('DATABASE_URL');
	const pgliteDir = optional('PGLITE_DIR') ?? '.data/pglite';
	if (databaseUrl === undefined) {
		mkdirSync(pgliteDir, { recursive: true });
	}
	return connect(databaseUrl, pgliteDir);
}
