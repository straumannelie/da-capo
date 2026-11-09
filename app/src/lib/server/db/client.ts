import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema.ts';

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface DatabaseHandle {
	readonly db: Database;
	migrate(migrationsFolder: string): Promise<void>;
	close(): Promise<void>;
}

export async function connectPostgres(url: string): Promise<DatabaseHandle> {
	const [{ default: postgres }, { drizzle }, { migrate }] = await Promise.all([
		import('postgres'),
		import('drizzle-orm/postgres-js'),
		import('drizzle-orm/postgres-js/migrator')
	]);
	const client = postgres(url, { prepare: false, max: 5 });
	const db = drizzle({ client, schema });
	return {
		db,
		migrate: (migrationsFolder) => migrate(db, { migrationsFolder }),
		close: () => client.end()
	};
}

export async function connectPglite(dataDir?: string): Promise<DatabaseHandle> {
	const [{ PGlite }, { drizzle }, { migrate }] = await Promise.all([
		import('@electric-sql/pglite'),
		import('drizzle-orm/pglite'),
		import('drizzle-orm/pglite/migrator')
	]);
	const client = new PGlite(dataDir);
	const db = drizzle({ client, schema });
	return {
		db,
		migrate: (migrationsFolder) => migrate(db, { migrationsFolder }),
		close: () => client.close()
	};
}

export function connect(
	databaseUrl: string | undefined,
	pgliteDir: string
): Promise<DatabaseHandle> {
	return databaseUrl ? connectPostgres(databaseUrl) : connectPglite(pgliteDir);
}
