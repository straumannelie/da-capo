import { and, asc, eq, ilike, inArray, isNotNull, not, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { relationLabel, workTitle, type RelationDirection } from '#lib/domain/labels.ts';
import {
	compareListensDesc,
	coverage,
	summarizeRecording,
	workRating,
	type Coverage
} from '#lib/domain/ratings.ts';
import { matchesSearch, searchTerms } from '#lib/domain/search.ts';
import type { Database } from '../db/client.ts';
import { composerRelations, composers, listens, recordings, works } from '../db/schema.ts';
import { composerStats, zeroIfNull } from './stats.ts';

export interface TimelineComposer {
	readonly id: number;
	readonly name: string;
	readonly birthYear: number;
	readonly deathYear: number | null;
	readonly epoch: string;
	readonly listened: boolean;
}

export interface ComposerListItem {
	readonly id: number;
	readonly name: string;
	readonly completeName: string;
	readonly birthYear: number | null;
	readonly deathYear: number | null;
	readonly epoch: string;
	readonly followed: boolean;
	readonly listenCount: number;
	readonly workCount: number;
}

export interface RelatedComposer {
	readonly id: number;
	readonly name: string;
	readonly completeName: string;
	readonly birthYear: number;
	readonly deathYear: number | null;
	readonly epoch: string;
	readonly listened: boolean;
	readonly relation: string;
	readonly isSelf: boolean;
}

export interface ComposerWork {
	readonly id: number;
	readonly title: string;
	readonly genre: string | null;
	readonly popular: boolean;
	readonly listenCount: number;
	readonly recordingCount: number;
	readonly rating: number | null;
}

export interface ComposerDetail {
	readonly id: number;
	readonly name: string;
	readonly completeName: string;
	readonly birthYear: number | null;
	readonly deathYear: number | null;
	readonly epoch: string;
	readonly birthPlace: string | null;
	readonly deathPlace: string | null;
	readonly bio: string | null;
	readonly bioUrl: string | null;
	readonly followed: boolean;
	readonly circle: readonly RelatedComposer[];
	readonly works: readonly ComposerWork[];
	readonly coverage: Coverage;
}

export interface WorkSummary {
	readonly id: number;
	readonly title: string;
	readonly genre: string | null;
}

export async function listTimelineComposers(db: Database): Promise<TimelineComposer[]> {
	const stats = composerStats(db);
	const rows = await db
		.select({
			id: composers.id,
			name: composers.name,
			birthYear: composers.birthYear,
			deathYear: composers.deathYear,
			epoch: composers.epoch,
			listenCount: zeroIfNull(stats.listenCount)
		})
		.from(composers)
		.leftJoin(stats, eq(stats.composerId, composers.id))
		.where(
			and(
				isNotNull(composers.birthYear),
				or(eq(composers.followed, true), isNotNull(stats.composerId))
			)
		);
	return rows.flatMap((row) =>
		row.birthYear === null
			? []
			: [
					{
						id: row.id,
						name: row.name,
						birthYear: row.birthYear,
						deathYear: row.deathYear,
						epoch: row.epoch,
						listened: row.listenCount > 0
					}
				]
	);
}

export async function listComposers(db: Database, query: string): Promise<ComposerListItem[]> {
	const stats = composerStats(db);
	const rows = await db
		.select({
			id: composers.id,
			name: composers.name,
			completeName: composers.completeName,
			birthYear: composers.birthYear,
			deathYear: composers.deathYear,
			epoch: composers.epoch,
			followed: composers.followed,
			listenCount: zeroIfNull(stats.listenCount),
			workCount: zeroIfNull(stats.workCount)
		})
		.from(composers)
		.leftJoin(stats, eq(stats.composerId, composers.id))
		.orderBy(asc(composers.birthYear), asc(composers.name));
	return rows.filter((row) => query.trim() === '' || matchesSearch(row.completeName, query));
}

async function listCircle(db: Database, composerId: number): Promise<RelatedComposer[]> {
	const other = alias(composers, 'other');
	const stats = composerStats(db);
	const select = {
		id: other.id,
		name: other.name,
		completeName: other.completeName,
		birthYear: other.birthYear,
		deathYear: other.deathYear,
		epoch: other.epoch,
		type: composerRelations.type,
		listenCount: zeroIfNull(stats.listenCount)
	};
	const [outgoing, incoming] = await Promise.all([
		db
			.select(select)
			.from(composerRelations)
			.innerJoin(other, eq(other.id, composerRelations.toId))
			.leftJoin(stats, eq(stats.composerId, other.id))
			.where(eq(composerRelations.fromId, composerId)),
		db
			.select(select)
			.from(composerRelations)
			.innerJoin(other, eq(other.id, composerRelations.fromId))
			.leftJoin(stats, eq(stats.composerId, other.id))
			.where(eq(composerRelations.toId, composerId))
	]);
	const tagged: [RelationDirection, typeof outgoing][] = [
		['outgoing', outgoing],
		['incoming', incoming]
	];
	const seen = new Set<number>();
	return tagged.flatMap(([direction, rows]) =>
		rows.flatMap((row) => {
			if (row.birthYear === null || seen.has(row.id)) {
				return [];
			}
			seen.add(row.id);
			return [
				{
					id: row.id,
					name: row.name,
					completeName: row.completeName,
					birthYear: row.birthYear,
					deathYear: row.deathYear,
					epoch: row.epoch,
					listened: row.listenCount > 0,
					relation: relationLabel(row.type, direction),
					isSelf: false
				}
			];
		})
	);
}

async function listComposerWorks(db: Database, composerId: number): Promise<ComposerWork[]> {
	const listenRows = await db
		.select({
			id: listens.id,
			listenedOn: listens.listenedOn,
			rating: listens.rating,
			movementRatings: listens.movementRatings,
			recordingId: recordings.id,
			isReference: recordings.isReference,
			workId: works.id
		})
		.from(listens)
		.innerJoin(recordings, eq(recordings.id, listens.recordingId))
		.innerJoin(works, eq(works.id, recordings.workId))
		.where(eq(works.composerId, composerId));

	const listenedWorkIds = [...new Set(listenRows.map((row) => row.workId))];
	const workRows = await db
		.select({
			id: works.id,
			title: works.title,
			titleFr: works.titleFr,
			genre: works.genre,
			popular: works.popular
		})
		.from(works)
		.where(
			and(
				eq(works.composerId, composerId),
				listenedWorkIds.length === 0
					? eq(works.popular, true)
					: or(eq(works.popular, true), inArray(works.id, listenedWorkIds))
			)
		)
		.orderBy(asc(works.title));

	const entries = workRows.map((work) => {
		const workListens = listenRows.filter((row) => row.workId === work.id);
		const byRecording = Map.groupBy(workListens, (row) => row.recordingId);
		const recordingsSummary = [...byRecording.values()].map((rows) => ({
			isReference: rows[0]?.isReference ?? false,
			summary: summarizeRecording(rows)
		}));
		const item: ComposerWork = {
			id: work.id,
			title: workTitle(work),
			genre: work.genre,
			popular: work.popular,
			listenCount: workListens.length,
			recordingCount: byRecording.size,
			rating: workRating(recordingsSummary)
		};
		return { item, lastListenedOn: [...workListens].sort(compareListensDesc)[0]?.listenedOn ?? '' };
	});

	return entries
		.sort(
			(a, b) =>
				Number(b.item.popular) - Number(a.item.popular) ||
				b.lastListenedOn.localeCompare(a.lastListenedOn) ||
				a.item.title.localeCompare(b.item.title, 'fr')
		)
		.map((entry) => entry.item);
}

export async function getComposerDetail(
	db: Database,
	composerId: number
): Promise<ComposerDetail | null> {
	const [composer] = await db.select().from(composers).where(eq(composers.id, composerId)).limit(1);
	if (!composer) {
		return null;
	}
	const [circle, composerWorks] = await Promise.all([
		listCircle(db, composerId),
		listComposerWorks(db, composerId)
	]);
	const self: RelatedComposer[] =
		composer.birthYear === null
			? []
			: [
					{
						id: composer.id,
						name: composer.name,
						completeName: composer.completeName,
						birthYear: composer.birthYear,
						deathYear: composer.deathYear,
						epoch: composer.epoch,
						listened: composerWorks.some((work) => work.listenCount > 0),
						relation: 'Lui-même',
						isSelf: true
					}
				];
	return {
		id: composer.id,
		name: composer.name,
		completeName: composer.completeName,
		birthYear: composer.birthYear,
		deathYear: composer.deathYear,
		epoch: composer.epoch,
		birthPlace: composer.birthPlace,
		deathPlace: composer.deathPlace,
		bio: composer.bio,
		bioUrl: composer.bioUrl,
		followed: composer.followed,
		circle: circle.length === 0 ? [] : [...self, ...circle],
		works: composerWorks,
		coverage: coverage(
			composerWorks.map((work) => ({ popular: work.popular, listened: work.listenCount > 0 }))
		)
	};
}

export async function searchComposerWorks(
	db: Database,
	composerId: number,
	query: string,
	limit = 40
): Promise<WorkSummary[]> {
	const terms = searchTerms(query);
	const rows = await db
		.select({ id: works.id, title: works.title, titleFr: works.titleFr, genre: works.genre })
		.from(works)
		.where(
			and(
				eq(works.composerId, composerId),
				not(works.popular),
				terms.length === 0
					? eq(works.recommended, true)
					: and(...terms.map((term) => ilike(works.searchText, `%${term}%`)))
			)
		)
		.orderBy(asc(works.title))
		.limit(limit);
	return rows.map((row) => ({ id: row.id, title: workTitle(row), genre: row.genre }));
}

export async function setFollowed(
	db: Database,
	composerId: number,
	followed: boolean
): Promise<void> {
	await db.update(composers).set({ followed }).where(eq(composers.id, composerId));
}
