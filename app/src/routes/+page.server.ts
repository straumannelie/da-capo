import { buildTimeline } from '#lib/domain/timeline.ts';
import { listTimelineComposers } from '#lib/server/repo/composers.ts';
import { listRecentListens } from '#lib/server/repo/listens.ts';
import { listWatchlist } from '#lib/server/repo/works.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const currentYear = new Date().getUTCFullYear();
	const [composers, recent, queue] = await Promise.all([
		listTimelineComposers(locals.db),
		listRecentListens(locals.db, 5),
		listWatchlist(locals.db, 5)
	]);
	return { timeline: buildTimeline(composers, currentYear), recent, queue, currentYear };
};
