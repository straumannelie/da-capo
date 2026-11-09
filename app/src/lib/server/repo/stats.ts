import { count, countDistinct, eq, sql, type SQL } from 'drizzle-orm';
import type { Database } from '../db/client.ts';
import { listens, recordings, works } from '../db/schema.ts';

export function composerStats(db: Database) {
	return db
		.select({
			composerId: works.composerId,
			listenCount: count(listens.id).as('listen_count'),
			workCount: countDistinct(works.id).as('work_count')
		})
		.from(listens)
		.innerJoin(recordings, eq(recordings.id, listens.recordingId))
		.innerJoin(works, eq(works.id, recordings.workId))
		.groupBy(works.composerId)
		.as('composer_stats');
}

export function zeroIfNull(column: SQL.Aliased<number>): SQL<number> {
	return sql<number>`coalesce(${column}, 0)`.mapWith(Number);
}
