import { listJournal } from '#lib/server/repo/listens.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const requested = Number(url.searchParams.get('page') ?? '1');
	const journal = await listJournal(locals.db, Number.isInteger(requested) ? requested : 1);
	return { journal, currentYear: new Date().getUTCFullYear() };
};
