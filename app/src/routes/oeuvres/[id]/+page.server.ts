import { error, fail, redirect } from '@sveltejs/kit';
import { parseMovementsForm, parseRecordingForm } from '#lib/domain/forms.ts';
import { addRecording, setReference } from '#lib/server/repo/recordings.ts';
import { getWorkDetail, saveMovements, setWatchlisted } from '#lib/server/repo/works.ts';
import type { Actions, PageServerLoad } from './$types';

function positiveInt(raw: string | null | FormDataEntryValue): number | null {
	const value = Number(raw);
	return typeof raw === 'string' && Number.isInteger(value) && value > 0 ? value : null;
}

function workId(raw: string): number {
	const id = positiveInt(raw);
	if (id === null) {
		error(404, 'Cette œuvre n’existe pas.');
	}
	return id;
}

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const work = await getWorkDetail(
		locals.db,
		workId(params.id),
		positiveInt(url.searchParams.get('version'))
	);
	if (!work) {
		error(404, 'Cette œuvre n’existe pas.');
	}
	return { work, currentYear: new Date().getUTCFullYear() };
};

export const actions: Actions = {
	addRecording: async ({ locals, params, request }) => {
		const id = workId(params.id);
		const parsed = parseRecordingForm(await request.formData(), new Date().getUTCFullYear());
		if (!parsed.ok) {
			return fail(400, { recordingErrors: parsed.errors });
		}
		const recordingId = await addRecording(locals.db, id, parsed.value);
		redirect(303, `/oeuvres/${id}?version=${recordingId}`);
	},
	setReference: async ({ locals, params, request }) => {
		const id = workId(params.id);
		const recordingId = positiveInt((await request.formData()).get('recordingId'));
		if (recordingId === null || !(await setReference(locals.db, id, recordingId))) {
			return fail(400, { message: 'Version introuvable.' });
		}
		return { success: true };
	},
	saveMovements: async ({ locals, params, request }) => {
		const parsed = parseMovementsForm(await request.formData());
		if (!parsed.ok) {
			return fail(400, { movementErrors: parsed.errors });
		}
		await saveMovements(locals.db, workId(params.id), parsed.value);
		return { success: true };
	},
	toggleWatchlist: async ({ locals, params, request }) => {
		const value = (await request.formData()).get('watchlisted');
		if (value !== 'true' && value !== 'false') {
			return fail(400, { message: 'Action invalide.' });
		}
		await setWatchlisted(locals.db, workId(params.id), value === 'true');
		return { success: true };
	}
};
