import { todayIso } from '#lib/domain/format.ts';
import { listConcerts } from '#lib/server/repo/concerts.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const today = todayIso();
	return { ...(await listConcerts(locals.db, today)), currentYear: Number(today.slice(0, 4)) };
};
