import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { countLabel } from '#lib/domain/format.ts';
import { importReference, referenceSchema } from '#lib/server/reference.ts';
import { connectFromEnv } from './env.ts';

const path = resolve(process.argv[2] ?? '../data/reference.json');
const parsed = referenceSchema.safeParse(JSON.parse(await readFile(path, 'utf8')));
if (!parsed.success) {
	console.error(`Fichier de référence invalide : ${path}`);
	console.error(parsed.error.issues.slice(0, 10));
	process.exit(1);
}

const handle = await connectFromEnv();
try {
	const summary = await importReference(handle.db, parsed.data);
	const parts = [
		countLabel(summary.composers, 'compositeur', 'compositeurs'),
		countLabel(summary.works, 'œuvre', 'œuvres'),
		countLabel(summary.relations, 'lien', 'liens')
	];
	console.log(`Import terminé : ${parts.join(', ')}.`);
	if (summary.skippedWorks > 0) {
		console.log(
			`${countLabel(summary.skippedWorks, 'œuvre ignorée', 'œuvres ignorées')} faute de compositeur.`
		);
	}
} finally {
	await handle.close();
}
