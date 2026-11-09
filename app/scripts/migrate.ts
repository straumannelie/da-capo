import { fileURLToPath } from 'node:url';
import { connectFromEnv } from './env.ts';

const handle = await connectFromEnv();
try {
	await handle.migrate(fileURLToPath(new URL('../drizzle', import.meta.url)));
	console.log('Migrations appliquées.');
} finally {
	await handle.close();
}
