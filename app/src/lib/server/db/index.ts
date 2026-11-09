import { DATABASE_URL, PGLITE_DIR } from '$app/env/private';
import { connect, type Database } from './client.ts';

let database: Promise<Database> | undefined;

export function getDb(): Promise<Database> {
	database ??= connect(DATABASE_URL, PGLITE_DIR).then((handle) => handle.db);
	return database;
}
