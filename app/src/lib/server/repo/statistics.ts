import { eq } from 'drizzle-orm';
import type { ListenFact } from '#lib/domain/stats.ts';
import type { Database } from '../db/client.ts';
import { composers, listens, recordings, works } from '../db/schema.ts';

export async function listListenFacts(db: Database): Promise<ListenFact[]> {
	const rows = await db
		.select({
			listenedOn: listens.listenedOn,
			rating: listens.rating,
			performers: recordings.performers,
			concertId: recordings.concertId,
			workId: works.id,
			genre: works.genre,
			composerId: composers.id,
			composerName: composers.name,
			epoch: composers.epoch,
			birthYear: composers.birthYear
		})
		.from(listens)
		.innerJoin(recordings, eq(recordings.id, listens.recordingId))
		.innerJoin(works, eq(works.id, recordings.workId))
		.innerJoin(composers, eq(composers.id, works.composerId));
	return rows.map(({ concertId, ...row }) => ({ ...row, inConcert: concertId !== null }));
}
