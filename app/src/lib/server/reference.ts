import { inArray, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { searchText } from '#lib/domain/search.ts';
import type { Database } from './db/client.ts';
import { composerRelations, composers, works } from './db/schema.ts';

const nullableText = z.string().nullable();

export const referenceSchema = z.object({
	version: z.literal(1),
	generated_at: z.iso.datetime({ offset: true }),
	composers: z.array(
		z.object({
			open_opus_id: z.number().int().positive(),
			name: z.string().min(1),
			complete_name: z.string().min(1),
			birth_year: z.number().int().nullable(),
			death_year: z.number().int().nullable(),
			epoch: z.string().min(1),
			popular: z.boolean(),
			recommended: z.boolean(),
			wikidata_id: nullableText,
			birth_place: nullableText,
			death_place: nullableText,
			bio: nullableText,
			bio_url: nullableText
		})
	),
	works: z.array(
		z.object({
			open_opus_id: z.number().int().positive(),
			composer_open_opus_id: z.number().int().positive(),
			title: z.string().min(1),
			title_fr: nullableText,
			subtitle: nullableText,
			genre: nullableText,
			popular: z.boolean(),
			recommended: z.boolean()
		})
	),
	relations: z.array(
		z.object({
			from_open_opus_id: z.number().int().positive(),
			to_open_opus_id: z.number().int().positive(),
			type: z.enum(['eleve_de', 'influence_par'])
		})
	)
});

export type ReferenceData = z.infer<typeof referenceSchema>;

export interface ImportSummary {
	readonly composers: number;
	readonly works: number;
	readonly relations: number;
	readonly skippedWorks: number;
}

const CHUNK_SIZE = 500;

function chunks<T>(items: readonly T[], size: number): T[][] {
	const result: T[][] = [];
	for (let index = 0; index < items.length; index += size) {
		result.push(items.slice(index, index + size));
	}
	return result;
}

function excluded(column: string): SQL {
	return sql.raw(`excluded."${column}"`);
}

export async function importReference(db: Database, data: ReferenceData): Promise<ImportSummary> {
	return db.transaction(async (tx) => {
		for (const batch of chunks(data.composers, CHUNK_SIZE)) {
			await tx
				.insert(composers)
				.values(
					batch.map((composer) => ({
						openOpusId: composer.open_opus_id,
						name: composer.name,
						completeName: composer.complete_name,
						birthYear: composer.birth_year,
						deathYear: composer.death_year,
						epoch: composer.epoch,
						popular: composer.popular,
						recommended: composer.recommended,
						wikidataId: composer.wikidata_id,
						birthPlace: composer.birth_place,
						deathPlace: composer.death_place,
						bio: composer.bio,
						bioUrl: composer.bio_url,
						followed: composer.popular
					}))
				)
				.onConflictDoUpdate({
					target: composers.openOpusId,
					set: {
						name: excluded('name'),
						completeName: excluded('complete_name'),
						birthYear: excluded('birth_year'),
						deathYear: excluded('death_year'),
						epoch: excluded('epoch'),
						popular: excluded('popular'),
						recommended: excluded('recommended'),
						wikidataId: excluded('wikidata_id'),
						birthPlace: excluded('birth_place'),
						deathPlace: excluded('death_place'),
						bio: excluded('bio'),
						bioUrl: excluded('bio_url')
					}
				});
		}

		const openOpusIds = data.composers.map((composer) => composer.open_opus_id);
		const idRows =
			openOpusIds.length === 0
				? []
				: await tx
						.select({ id: composers.id, openOpusId: composers.openOpusId })
						.from(composers)
						.where(inArray(composers.openOpusId, openOpusIds));
		const composerIds = new Map(idRows.map((row) => [row.openOpusId, row.id]));

		const composerNames = new Map(
			data.composers.map((composer) => [composer.open_opus_id, composer.complete_name])
		);
		const knownWorks = data.works.flatMap((work) => {
			const composerId = composerIds.get(work.composer_open_opus_id);
			const composerName = composerNames.get(work.composer_open_opus_id) ?? '';
			return composerId === undefined ? [] : [{ work, composerId, composerName }];
		});

		for (const batch of chunks(knownWorks, CHUNK_SIZE)) {
			await tx
				.insert(works)
				.values(
					batch.map(({ work, composerId, composerName }) => ({
						openOpusId: work.open_opus_id,
						composerId,
						title: work.title,
						titleFr: work.title_fr,
						subtitle: work.subtitle,
						genre: work.genre,
						popular: work.popular,
						recommended: work.recommended,
						searchText: searchText([work.title, work.title_fr, work.subtitle, composerName])
					}))
				)
				.onConflictDoUpdate({
					target: works.openOpusId,
					set: {
						composerId: excluded('composer_id'),
						title: excluded('title'),
						titleFr: excluded('title_fr'),
						subtitle: excluded('subtitle'),
						genre: excluded('genre'),
						popular: excluded('popular'),
						recommended: excluded('recommended'),
						searchText: excluded('search_text')
					}
				});
		}

		const relations = data.relations.flatMap((relation) => {
			const fromId = composerIds.get(relation.from_open_opus_id);
			const toId = composerIds.get(relation.to_open_opus_id);
			return fromId === undefined || toId === undefined || fromId === toId
				? []
				: [{ fromId, toId, type: relation.type }];
		});

		await tx.delete(composerRelations);
		for (const batch of chunks(relations, CHUNK_SIZE)) {
			await tx.insert(composerRelations).values(batch).onConflictDoNothing();
		}

		return {
			composers: data.composers.length,
			works: knownWorks.length,
			relations: relations.length,
			skippedWorks: data.works.length - knownWorks.length
		};
	});
}
