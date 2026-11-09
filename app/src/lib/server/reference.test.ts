import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseHandle } from './db/client.ts';
import { composers, works } from './db/schema.ts';
import { importReference, referenceSchema } from './reference.ts';
import { createTestDatabase } from './testing/database.ts';
import { referenceFixture } from './testing/fixtures.ts';

describe('importReference', () => {
	let handle: DatabaseHandle;

	beforeEach(async () => {
		handle = await createTestDatabase();
	});

	afterEach(async () => {
		await handle.close();
	});

	it('valide le fichier de référence', () => {
		expect(referenceSchema.safeParse(referenceFixture).success).toBe(true);
	});

	it('importe compositeurs, œuvres et liens en ignorant les orphelines', async () => {
		const summary = await importReference(handle.db, referenceFixture);
		expect(summary).toEqual({ composers: 3, works: 3, relations: 2, skippedWorks: 1 });
		const followed = await handle.db
			.select({ name: composers.name })
			.from(composers)
			.where(eq(composers.followed, true));
		expect(followed.map((row) => row.name).sort()).toEqual(['Brahms', 'Dvořák']);
	});

	it('indexe le texte de recherche sans accents', async () => {
		await importReference(handle.db, referenceFixture);
		const [work] = await handle.db
			.select({ searchText: works.searchText })
			.from(works)
			.where(eq(works.openOpusId, 9001));
		expect(work?.searchText).toContain('antonin dvorak');
	});

	it('réimporte sans écraser les choix personnels', async () => {
		await importReference(handle.db, referenceFixture);
		await handle.db.update(composers).set({ followed: true }).where(eq(composers.openOpusId, 300));
		await handle.db
			.update(works)
			.set({ movements: ['Allegro', 'Adagio', 'Finale'] })
			.where(eq(works.openOpusId, 9001));

		await importReference(handle.db, {
			...referenceFixture,
			works: referenceFixture.works.map((work) =>
				work.open_opus_id === 9001 ? { ...work, title_fr: 'Concerto op. 104' } : work
			)
		});

		const [suk] = await handle.db
			.select({ followed: composers.followed })
			.from(composers)
			.where(eq(composers.openOpusId, 300));
		const [concerto] = await handle.db
			.select({ titleFr: works.titleFr, movements: works.movements })
			.from(works)
			.where(eq(works.openOpusId, 9001));
		expect(suk?.followed).toBe(true);
		expect(concerto).toEqual({
			titleFr: 'Concerto op. 104',
			movements: ['Allegro', 'Adagio', 'Finale']
		});
	});
});
