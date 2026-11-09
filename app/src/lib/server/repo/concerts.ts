import { and, asc, desc, eq, gte, inArray, lt } from 'drizzle-orm';
import type { ConcertInput, ProgramItemInput } from '#lib/domain/forms.ts';
import { workTitle } from '#lib/domain/labels.ts';
import { summarizeRecording, type RecordingSummary } from '#lib/domain/ratings.ts';
import type { Database } from '../db/client.ts';
import { composers, concerts, listens, recordings, works } from '../db/schema.ts';

export interface ProgramItem {
	readonly recordingId: number;
	readonly workId: number;
	readonly title: string;
	readonly composerId: number;
	readonly composerName: string;
	readonly epoch: string;
	readonly birthYear: number | null;
	readonly performers: string;
	readonly summary: RecordingSummary;
}

export interface ConcertDetail {
	readonly id: number;
	readonly date: string;
	readonly venue: string;
	readonly title: string | null;
	readonly performers: string;
	readonly notes: string | null;
	readonly program: readonly ProgramItem[];
}

export interface ConcertListItem {
	readonly id: number;
	readonly date: string;
	readonly venue: string;
	readonly title: string | null;
	readonly composers: readonly string[];
	readonly programSize: number;
	readonly ratedCount: number;
}

export async function createConcert(db: Database, input: ConcertInput): Promise<number> {
	const [row] = await db.insert(concerts).values(input).returning({ id: concerts.id });
	if (!row) {
		throw new Error('Le concert n’a pas été enregistré.');
	}
	return row.id;
}

export async function updateConcertNotes(
	db: Database,
	concertId: number,
	notes: string | null
): Promise<void> {
	await db.update(concerts).set({ notes }).where(eq(concerts.id, concertId));
}

export async function deleteConcert(db: Database, concertId: number): Promise<void> {
	await db.delete(concerts).where(eq(concerts.id, concertId));
}

async function loadPrograms(db: Database, concertIds: readonly number[]) {
	if (concertIds.length === 0) {
		return { items: [], listenRows: [] };
	}
	const items = await db
		.select({
			concertId: recordings.concertId,
			recordingId: recordings.id,
			performers: recordings.performers,
			workId: works.id,
			title: works.title,
			titleFr: works.titleFr,
			composerId: composers.id,
			composerName: composers.name,
			epoch: composers.epoch,
			birthYear: composers.birthYear
		})
		.from(recordings)
		.innerJoin(works, eq(works.id, recordings.workId))
		.innerJoin(composers, eq(composers.id, works.composerId))
		.where(inArray(recordings.concertId, [...concertIds]))
		.orderBy(asc(recordings.id));
	const recordingIds = items.map((item) => item.recordingId);
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
	return { items, listenRows };
}

export async function getConcert(db: Database, concertId: number): Promise<ConcertDetail | null> {
	const [concert] = await db.select().from(concerts).where(eq(concerts.id, concertId)).limit(1);
	if (!concert) {
		return null;
	}
	const { items, listenRows } = await loadPrograms(db, [concertId]);
	const byRecording = Map.groupBy(listenRows, (row) => row.recordingId);
	return {
		id: concert.id,
		date: concert.date,
		venue: concert.venue,
		title: concert.title,
		performers: concert.performers,
		notes: concert.notes,
		program: items.map((item) => ({
			recordingId: item.recordingId,
			workId: item.workId,
			title: workTitle(item),
			composerId: item.composerId,
			composerName: item.composerName,
			epoch: item.epoch,
			birthYear: item.birthYear,
			performers: item.performers,
			summary: summarizeRecording(byRecording.get(item.recordingId) ?? [])
		}))
	};
}

export async function listConcerts(
	db: Database,
	today: string
): Promise<{ upcoming: ConcertListItem[]; past: ConcertListItem[] }> {
	const [upcomingRows, pastRows] = await Promise.all([
		db.select().from(concerts).where(gte(concerts.date, today)).orderBy(asc(concerts.date)),
		db.select().from(concerts).where(lt(concerts.date, today)).orderBy(desc(concerts.date))
	]);
	const { items, listenRows } = await loadPrograms(
		db,
		[...upcomingRows, ...pastRows].map((concert) => concert.id)
	);
	const rated = new Set(listenRows.map((row) => row.recordingId));
	const byConcert = Map.groupBy(items, (item) => item.concertId ?? 0);
	const toItem = (concert: typeof concerts.$inferSelect): ConcertListItem => {
		const program = byConcert.get(concert.id) ?? [];
		return {
			id: concert.id,
			date: concert.date,
			venue: concert.venue,
			title: concert.title,
			composers: [...new Set(program.map((item) => item.composerName))],
			programSize: program.length,
			ratedCount: program.filter((item) => rated.has(item.recordingId)).length
		};
	};
	return { upcoming: upcomingRows.map(toItem), past: pastRows.map(toItem) };
}

export async function addProgramItem(
	db: Database,
	concertId: number,
	input: ProgramItemInput
): Promise<number | null> {
	const [concert] = await db
		.select({ date: concerts.date, performers: concerts.performers })
		.from(concerts)
		.where(eq(concerts.id, concertId))
		.limit(1);
	if (!concert) {
		return null;
	}
	const [row] = await db
		.insert(recordings)
		.values({
			workId: input.workId,
			concertId,
			performers: input.performers ?? concert.performers,
			year: Number(concert.date.slice(0, 4))
		})
		.returning({ id: recordings.id });
	return row?.id ?? null;
}

export async function removeProgramItem(
	db: Database,
	concertId: number,
	recordingId: number
): Promise<void> {
	await db
		.delete(recordings)
		.where(and(eq(recordings.id, recordingId), eq(recordings.concertId, concertId)));
}
