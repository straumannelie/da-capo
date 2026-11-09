import { error, fail, redirect } from '@sveltejs/kit';
import { parseProgramItemForm } from '#lib/domain/forms.ts';
import { todayIso } from '#lib/domain/format.ts';
import {
	addProgramItem,
	deleteConcert,
	getConcert,
	removeProgramItem,
	updateConcertNotes
} from '#lib/server/repo/concerts.ts';
import { searchWorks } from '#lib/server/repo/works.ts';
import type { Actions, PageServerLoad } from './$types';

function concertId(raw: string): number {
	const id = Number(raw);
	if (!Number.isInteger(id) || id <= 0) {
		error(404, 'Ce concert n’existe pas.');
	}
	return id;
}

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const id = concertId(params.id);
	const query = url.searchParams.get('q') ?? '';
	const [concert, results] = await Promise.all([
		getConcert(locals.db, id),
		searchWorks(locals.db, query, 12)
	]);
	if (!concert) {
		error(404, 'Ce concert n’existe pas.');
	}
	return { concert, query, results, today: todayIso() };
};

export const actions: Actions = {
	addItem: async ({ locals, params, request }) => {
		const id = concertId(params.id);
		const parsed = parseProgramItemForm(await request.formData());
		if (!parsed.ok) {
			return fail(400, { programError: 'Choisis une œuvre dans les résultats.' });
		}
		if ((await addProgramItem(locals.db, id, parsed.value)) === null) {
			error(404, 'Ce concert n’existe pas.');
		}
		redirect(303, `/concerts/${id}`);
	},
	removeItem: async ({ locals, params, request }) => {
		const recordingId = Number((await request.formData()).get('recordingId'));
		if (!Number.isInteger(recordingId) || recordingId <= 0) {
			return fail(400, { programError: 'Œuvre introuvable.' });
		}
		await removeProgramItem(locals.db, concertId(params.id), recordingId);
		return { success: true };
	},
	saveNotes: async ({ locals, params, request }) => {
		const raw = (await request.formData()).get('notes');
		const notes = typeof raw === 'string' ? raw.trim() : '';
		if (notes.length > 5000) {
			return fail(400, { notesError: 'Les notes sont limitées à 5 000 caractères.' });
		}
		await updateConcertNotes(locals.db, concertId(params.id), notes === '' ? null : notes);
		return { success: true };
	},
	delete: async ({ locals, params }) => {
		await deleteConcert(locals.db, concertId(params.id));
		redirect(303, '/concerts');
	}
};
