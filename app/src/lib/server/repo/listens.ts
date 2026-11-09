import { and, count, desc, eq } from 'drizzle-orm';
import type { ListenInput } from '#lib/domain/forms.ts';
import { workTitle } from '#lib/domain/labels.ts';
import type { Database } from '../db/client.ts';
import { composers, listens, moments, recordings, works } from '../db/schema.ts';

export interface ListenListItem {
	readonly id: number;
	readonly listenedOn: string;
	readonly rating: number;
	readonly notes: string | null;
	readonly workId: number;
	readonly workTitle: string;
	readonly composerName: string;
	readonly epoch: string;
	readonly birthYear: number | null;
	readonly recordingId: number;
	readonly performers: string;
	readonly concertId: number | null;
}

export interface JournalPage {
	readonly items: readonly ListenListItem[];
	readonly total: number;
	readonly page: number;
	readonly pageCount: number;
}

export type CreateListenResult =
	| { readonly ok: true; readonly recordingId: number; readonly listenId: number }
	| { readonly ok: false; readonly reason: 'unknown-recording' };

export async function createListen(db: Database, input: ListenInput): Promise<CreateListenResult> {
	return db.transaction(async (tx) => {
		let recordingId: number;
		if (input.recording.kind === 'existing') {
			const [existing] = await tx
				.select({ id: recordings.id })
				.from(recordings)
				.where(and(eq(recordings.id, input.recording.id), eq(recordings.workId, input.workId)))
				.limit(1);
			if (!existing) {
				return { ok: false, reason: 'unknown-recording' };
			}
			recordingId = existing.id;
		} else {
			const [created] = await tx
				.insert(recordings)
				.values({
					workId: input.workId,
					performers: input.recording.performers,
					year: input.recording.year
				})
				.returning({ id: recordings.id });
			if (!created) {
				throw new Error('La version n’a pas été enregistrée.');
			}
			recordingId = created.id;
		}

		const [listen] = await tx
			.insert(listens)
			.values({
				recordingId,
				listenedOn: input.listenedOn,
				rating: input.rating,
				movementRatings: [...input.movementRatings],
				notes: input.notes
			})
			.returning({ id: listens.id });
		if (!listen) {
			throw new Error('L’écoute n’a pas été enregistrée.');
		}

		if (input.moments.length > 0) {
			await tx.insert(moments).values(
				input.moments.map((moment, position) => ({
					listenId: listen.id,
					position,
					movement: moment.movement,
					atSeconds: moment.atSeconds,
					note: moment.note
				}))
			);
		}

		return { ok: true, recordingId, listenId: listen.id };
	});
}

function listenQuery(db: Database) {
	return db
		.select({
			id: listens.id,
			listenedOn: listens.listenedOn,
			rating: listens.rating,
			notes: listens.notes,
			workId: works.id,
			title: works.title,
			titleFr: works.titleFr,
			composerName: composers.name,
			epoch: composers.epoch,
			birthYear: composers.birthYear,
			recordingId: recordings.id,
			performers: recordings.performers,
			concertId: recordings.concertId
		})
		.from(listens)
		.innerJoin(recordings, eq(recordings.id, listens.recordingId))
		.innerJoin(works, eq(works.id, recordings.workId))
		.innerJoin(composers, eq(composers.id, works.composerId))
		.orderBy(desc(listens.listenedOn), desc(listens.id))
		.$dynamic();
}

type ListenRow = Awaited<ReturnType<typeof listenQuery>>[number];

function toListItem({ title, titleFr, ...row }: ListenRow): ListenListItem {
	return { ...row, workTitle: workTitle({ title, titleFr }) };
}

export async function listRecentListens(db: Database, limit = 5): Promise<ListenListItem[]> {
	const rows = await listenQuery(db).limit(limit);
	return rows.map(toListItem);
}

export async function listJournal(db: Database, page: number, pageSize = 20): Promise<JournalPage> {
	const [totals] = await db.select({ total: count() }).from(listens);
	const total = totals?.total ?? 0;
	const pageCount = Math.max(1, Math.ceil(total / pageSize));
	const current = Math.min(Math.max(1, page), pageCount);
	const rows = await listenQuery(db)
		.limit(pageSize)
		.offset((current - 1) * pageSize);
	return { items: rows.map(toListItem), total, page: current, pageCount };
}
