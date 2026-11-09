import { and, asc, desc, eq, ilike, inArray, max } from 'drizzle-orm';
import { workTitle } from '#lib/domain/labels.ts';
import { summarizeRecording, type RecordingSummary } from '#lib/domain/ratings.ts';
import { searchTerms } from '#lib/domain/search.ts';
import type { Database } from '../db/client.ts';
import {
	composers,
	concerts,
	listens,
	moments,
	recordings,
	watchlist,
	works
} from '../db/schema.ts';

export interface WorkRecording {
	readonly id: number;
	readonly performers: string;
	readonly year: number | null;
	readonly isReference: boolean;
	readonly concert: { readonly id: number; readonly date: string; readonly venue: string } | null;
	readonly summary: RecordingSummary;
}

export interface ListenEntry {
	readonly id: number;
	readonly listenedOn: string;
	readonly rating: number;
	readonly movementRatings: readonly (number | null)[];
	readonly notes: string | null;
	readonly moments: readonly {
		readonly movement: number | null;
		readonly atSeconds: number | null;
		readonly note: string;
	}[];
}

export interface WorkDetail {
	readonly id: number;
	readonly title: string;
	readonly originalTitle: string;
	readonly subtitle: string | null;
	readonly genre: string | null;
	readonly movements: readonly string[];
	readonly inWatchlist: boolean;
	readonly composer: {
		readonly id: number;
		readonly name: string;
		readonly completeName: string;
		readonly epoch: string;
		readonly birthYear: number | null;
	};
	readonly recordings: readonly WorkRecording[];
	readonly selectedRecordingId: number | null;
	readonly entries: readonly ListenEntry[];
	readonly listenCount: number;
}

export interface WorkSearchResult {
	readonly id: number;
	readonly title: string;
	readonly composerName: string;
	readonly epoch: string;
	readonly birthYear: number | null;
}

function compareRecordings(a: WorkRecording, b: WorkRecording): number {
	return (
		Number(b.isReference) - Number(a.isReference) ||
		Number(b.summary.listenCount > 0) - Number(a.summary.listenCount > 0) ||
		(b.summary.lastListenedOn ?? '').localeCompare(a.summary.lastListenedOn ?? '') ||
		a.id - b.id
	);
}

async function listEntries(db: Database, recordingId: number): Promise<ListenEntry[]> {
	const listenRows = await db
		.select({
			id: listens.id,
			listenedOn: listens.listenedOn,
			rating: listens.rating,
			movementRatings: listens.movementRatings,
			notes: listens.notes
		})
		.from(listens)
		.where(eq(listens.recordingId, recordingId))
		.orderBy(desc(listens.listenedOn), desc(listens.id));
	const listenIds = listenRows.map((row) => row.id);
	const momentRows =
		listenIds.length === 0
			? []
			: await db
					.select({
						listenId: moments.listenId,
						movement: moments.movement,
						atSeconds: moments.atSeconds,
						note: moments.note
					})
					.from(moments)
					.where(inArray(moments.listenId, listenIds))
					.orderBy(asc(moments.position));
	const byListen = Map.groupBy(momentRows, (row) => row.listenId);
	return listenRows.map((row) => ({
		...row,
		moments: (byListen.get(row.id) ?? []).map(({ movement, atSeconds, note }) => ({
			movement,
			atSeconds,
			note
		}))
	}));
}

export async function getWorkDetail(
	db: Database,
	workId: number,
	requestedRecordingId: number | null
): Promise<WorkDetail | null> {
	const [row] = await db
		.select({
			id: works.id,
			title: works.title,
			titleFr: works.titleFr,
			subtitle: works.subtitle,
			genre: works.genre,
			movements: works.movements,
			watchlisted: watchlist.workId,
			composerId: composers.id,
			composerName: composers.name,
			composerCompleteName: composers.completeName,
			composerEpoch: composers.epoch,
			composerBirthYear: composers.birthYear
		})
		.from(works)
		.innerJoin(composers, eq(composers.id, works.composerId))
		.leftJoin(watchlist, eq(watchlist.workId, works.id))
		.where(eq(works.id, workId))
		.limit(1);
	if (!row) {
		return null;
	}

	const recordingRows = await db
		.select({
			id: recordings.id,
			performers: recordings.performers,
			year: recordings.year,
			isReference: recordings.isReference,
			concertId: concerts.id,
			concertDate: concerts.date,
			concertVenue: concerts.venue
		})
		.from(recordings)
		.leftJoin(concerts, eq(concerts.id, recordings.concertId))
		.where(eq(recordings.workId, workId));
	const recordingIds = recordingRows.map((recording) => recording.id);
	const listenRows =
		recordingIds.length === 0
			? []
			: await db
					.select({
						id: listens.id,
						recordingId: listens.recordingId,
						listenedOn: listens.listenedOn,
						rating: listens.rating,
						movementRatings: listens.movementRatings
					})
					.from(listens)
					.where(inArray(listens.recordingId, recordingIds));
	const listensByRecording = Map.groupBy(listenRows, (listen) => listen.recordingId);
	const workRecordings = recordingRows
		.map(({ concertId, concertDate, concertVenue, ...recording }) => ({
			...recording,
			concert:
				concertId === null || concertDate === null || concertVenue === null
					? null
					: { id: concertId, date: concertDate, venue: concertVenue },
			summary: summarizeRecording(listensByRecording.get(recording.id) ?? [])
		}))
		.sort(compareRecordings);

	const selectedRecordingId =
		workRecordings.find((recording) => recording.id === requestedRecordingId)?.id ??
		workRecordings[0]?.id ??
		null;

	return {
		id: row.id,
		title: workTitle(row),
		originalTitle: row.title,
		subtitle: row.subtitle,
		genre: row.genre,
		movements: row.movements,
		inWatchlist: row.watchlisted !== null,
		composer: {
			id: row.composerId,
			name: row.composerName,
			completeName: row.composerCompleteName,
			epoch: row.composerEpoch,
			birthYear: row.composerBirthYear
		},
		recordings: workRecordings,
		selectedRecordingId,
		entries: selectedRecordingId === null ? [] : await listEntries(db, selectedRecordingId),
		listenCount: listenRows.length
	};
}

const searchSelect = {
	id: works.id,
	title: works.title,
	titleFr: works.titleFr,
	composerName: composers.name,
	epoch: composers.epoch,
	birthYear: composers.birthYear
};

function toSearchResult(row: {
	id: number;
	title: string;
	titleFr: string | null;
	composerName: string;
	epoch: string;
	birthYear: number | null;
}): WorkSearchResult {
	return {
		id: row.id,
		title: workTitle(row),
		composerName: row.composerName,
		epoch: row.epoch,
		birthYear: row.birthYear
	};
}

export async function searchWorks(
	db: Database,
	query: string,
	limit = 30
): Promise<WorkSearchResult[]> {
	const terms = searchTerms(query);
	if (terms.length === 0) {
		return [];
	}
	const rows = await db
		.select(searchSelect)
		.from(works)
		.innerJoin(composers, eq(composers.id, works.composerId))
		.where(and(...terms.map((term) => ilike(works.searchText, `%${term}%`))))
		.orderBy(desc(works.popular), desc(works.recommended), asc(composers.name), asc(works.title))
		.limit(limit);
	return rows.map(toSearchResult);
}

export async function listRecentWorks(db: Database, limit = 6): Promise<WorkSearchResult[]> {
	const lastListened = max(listens.listenedOn);
	const rows = await db
		.select({ ...searchSelect, lastListened })
		.from(listens)
		.innerJoin(recordings, eq(recordings.id, listens.recordingId))
		.innerJoin(works, eq(works.id, recordings.workId))
		.innerJoin(composers, eq(composers.id, works.composerId))
		.groupBy(works.id, composers.id)
		.orderBy(desc(lastListened))
		.limit(limit);
	return rows.map(toSearchResult);
}

export async function listWatchlist(db: Database, limit = 8): Promise<WorkSearchResult[]> {
	const rows = await db
		.select(searchSelect)
		.from(watchlist)
		.innerJoin(works, eq(works.id, watchlist.workId))
		.innerJoin(composers, eq(composers.id, works.composerId))
		.orderBy(asc(watchlist.addedAt))
		.limit(limit);
	return rows.map(toSearchResult);
}

export async function getWorkMovements(db: Database, workId: number): Promise<string[] | null> {
	const [row] = await db
		.select({ movements: works.movements })
		.from(works)
		.where(eq(works.id, workId))
		.limit(1);
	return row ? row.movements : null;
}

export async function saveMovements(
	db: Database,
	workId: number,
	movements: readonly string[]
): Promise<void> {
	await db
		.update(works)
		.set({ movements: [...movements] })
		.where(eq(works.id, workId));
}

export async function setWatchlisted(
	db: Database,
	workId: number,
	watchlisted: boolean
): Promise<void> {
	if (watchlisted) {
		await db.insert(watchlist).values({ workId }).onConflictDoNothing();
	} else {
		await db.delete(watchlist).where(eq(watchlist.workId, workId));
	}
}
