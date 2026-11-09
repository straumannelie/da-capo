import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { referenceSchema } from './reference.ts';

const SNAPSHOT = new URL(
	'../../../../pipeline/tests/fixtures/reference.snapshot.json',
	import.meta.url
);

describe('contrat avec le pipeline Python', () => {
	it('accepte le fichier produit par le pipeline', async () => {
		const parsed = referenceSchema.safeParse(JSON.parse(await readFile(SNAPSHOT, 'utf8')));
		expect(parsed.error?.issues ?? []).toEqual([]);
	});
});
