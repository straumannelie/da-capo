import { error, fail, redirect } from '@sveltejs/kit';
import { parseListenForm } from '#lib/domain/forms.ts';
import { todayIso } from '#lib/domain/format.ts';
import { safeRedirectTarget } from '#lib/server/auth.ts';
import { createListen } from '#lib/server/repo/listens.ts';
import {
	getWorkDetail,
	getWorkMovements,
	listRecentWorks,
	listWatchlist,
	searchWorks
} from '#lib/server/repo/works.ts';
import type { Actions, PageServerLoad } from './$types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function returnPath(raw: string | null): string | null {
	return raw !== null && safeRedirectTarget(raw) === raw ? raw : null;
}

function positiveInt(raw: string | null): number | null {
	const value = Number(raw);
	return raw !== null && Number.isInteger(value) && value > 0 ? value : null;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const workId = positiveInt(url.searchParams.get('oeuvre'));
	if (workId !== null) {
		const work = await getWorkDetail(
			locals.db,
			workId,
			positiveInt(url.searchParams.get('version'))
		);
		if (!work) {
			error(404, 'Cette œuvre n’existe pas.');
		}
		const date = url.searchParams.get('date');
		return {
			mode: 'form' as const,
			work,
			defaultDate: date !== null && ISO_DATE.test(date) ? date : todayIso(),
			returnTo: returnPath(url.searchParams.get('suite'))
		};
	}

	const query = url.searchParams.get('q') ?? '';
	const [results, queue, recent] = await Promise.all([
		searchWorks(locals.db, query),
		query === '' ? listWatchlist(locals.db, 6) : Promise.resolve([]),
		query === '' ? listRecentWorks(locals.db, 6) : Promise.resolve([])
	]);
	return { mode: 'search' as const, query, results, queue, recent };
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const form = await request.formData();
		const rawWorkId = form.get('workId');
		const workId = positiveInt(typeof rawWorkId === 'string' ? rawWorkId : null);
		const movements = workId === null ? null : await getWorkMovements(locals.db, workId);
		const values = Object.fromEntries(
			[...form.entries()].filter((entry): entry is [string, string] => typeof entry[1] === 'string')
		);
		if (movements === null) {
			return fail(400, { errors: { workId: 'Cette œuvre n’existe pas.' }, values });
		}

		const parsed = parseListenForm(form, movements.length, new Date().getUTCFullYear());
		if (!parsed.ok) {
			return fail(400, { errors: parsed.errors, values });
		}
		const result = await createListen(locals.db, parsed.value);
		if (!result.ok) {
			return fail(400, { errors: { recording: 'Cette version n’existe plus.' }, values });
		}
		const returnTo = form.get('suite');
		redirect(
			303,
			returnPath(typeof returnTo === 'string' ? returnTo : null) ??
				`/oeuvres/${parsed.value.workId}?version=${result.recordingId}`
		);
	}
};
