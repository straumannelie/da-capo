import { todayIso } from '#lib/domain/format.ts';
import { buildStatistics } from '#lib/domain/stats.ts';
import { listListenFacts } from '#lib/server/repo/statistics.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	stats: buildStatistics(await listListenFacts(locals.db), todayIso())
});
