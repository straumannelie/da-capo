import { fail, redirect } from '@sveltejs/kit';
import { parseConcertForm } from '#lib/domain/forms.ts';
import { todayIso } from '#lib/domain/format.ts';
import { createConcert } from '#lib/server/repo/concerts.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ today: todayIso() });

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const form = await request.formData();
		const parsed = parseConcertForm(form);
		if (!parsed.ok) {
			const values = Object.fromEntries(
				[...form.entries()].filter(
					(entry): entry is [string, string] => typeof entry[1] === 'string'
				)
			);
			return fail(400, { errors: parsed.errors, values });
		}
		const id = await createConcert(locals.db, parsed.value);
		redirect(303, `/concerts/${id}`);
	}
};
