import { fileURLToPath } from 'node:url';
import { connectPglite, type DatabaseHandle } from '../db/client.ts';

const MIGRATIONS = fileURLToPath(new URL('../../../../drizzle', import.meta.url));

export async function createTestDatabase(): Promise<DatabaseHandle> {
	const handle = await connectPglite();
	await handle.migrate(MIGRATIONS);
	return handle;
}
