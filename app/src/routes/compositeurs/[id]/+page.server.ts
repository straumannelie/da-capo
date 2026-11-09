import { error, fail } from '@sveltejs/kit';
import { getComposerDetail, searchComposerWorks, setFollowed } from '#lib/server/repo/composers.ts';
import type { Actions, PageServerLoad } from './$types';

function composerId(raw: string): number {
	const id = Number(raw);
	if (!Number.isInteger(id) || id <= 0) {
		error(404, 'Ce compositeur n’existe pas.');
	}
	return id;
}

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const id = composerId(params.id);
	const query = url.searchParams.get('q') ?? '';
	const [composer, otherWorks] = await Promise.all([
		getComposerDetail(locals.db, id),
		searchComposerWorks(locals.db, id, query)
	]);
	if (!composer) {
		error(404, 'Ce compositeur n’existe pas.');
	}
	return { composer, otherWorks, query, currentYear: new Date().getUTCFullYear() };
};

export const actions: Actions = {
	follow: async ({ locals, params, request }) => {
		const form = await request.formData();
		const followed = form.get('followed');
		if (followed !== 'true' && followed !== 'false') {
			return fail(400, { message: 'Action invalide.' });
		}
		await setFollowed(locals.db, composerId(params.id), followed === 'true');
		return { success: true };
	}
};
