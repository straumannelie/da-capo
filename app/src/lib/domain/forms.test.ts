import { describe, expect, it } from 'vitest';
import {
	parseConcertForm,
	parseListenForm,
	parseMovementsForm,
	parseProgramItemForm,
	parseRecordingForm
} from './forms.ts';

function form(entries: Record<string, string | string[]>): FormData {
	const data = new FormData();
	for (const [key, value] of Object.entries(entries)) {
		for (const item of Array.isArray(value) ? value : [value]) {
			data.append(key, item);
		}
	}
	return data;
}

const base = {
	workId: '12',
	recording: '3',
	performers: '',
	year: '',
	listenedOn: '2026-11-09',
	rating: '9',
	notes: '  Très beau  ',
	moments: 'II 7:10 Les bois'
};

describe('parseListenForm', () => {
	it('lit une écoute sur une version existante', () => {
		const result = parseListenForm(form(base), 3, 2026);
		expect(result).toEqual({
			ok: true,
			value: {
				workId: 12,
				recording: { kind: 'existing', id: 3 },
				listenedOn: '2026-11-09',
				rating: 9,
				movementRatings: [],
				notes: 'Très beau',
				moments: [{ movement: 2, atSeconds: 430, note: 'Les bois' }]
			}
		});
	});

	it('crée une nouvelle version avec ses interprètes', () => {
		const result = parseListenForm(
			form({ ...base, recording: 'new', performers: 'Du Pré, Barenboim', year: '1970' }),
			0,
			2026
		);
		expect(result.ok && result.value.recording).toEqual({
			kind: 'new',
			performers: 'Du Pré, Barenboim',
			year: 1970
		});
	});

	it('exige les interprètes d’une nouvelle version', () => {
		const result = parseListenForm(form({ ...base, recording: 'new' }), 0, 2026);
		expect(result.ok).toBe(false);
		expect(!result.ok && result.errors['performers']).toBeTruthy();
	});

	it('refuse une note hors de 1 à 10 et une année future', () => {
		const result = parseListenForm(
			form({ ...base, recording: 'new', performers: 'X', rating: '11', year: '2031' }),
			0,
			2026
		);
		expect(!result.ok && Object.keys(result.errors).sort()).toEqual(['rating', 'year']);
	});

	it('signale toutes les erreurs d’un coup, interprètes compris', () => {
		const result = parseListenForm(form({ ...base, recording: 'new', rating: '0' }), 0, 2026);
		expect(!result.ok && Object.keys(result.errors).sort()).toEqual(['performers', 'rating']);
	});

	it('lit les notes par mouvement et ignore les vides', () => {
		const result = parseListenForm(form({ ...base, movementRating: ['9', '', '8'] }), 3, 2026);
		expect(result.ok && result.value.movementRatings).toEqual([9, null, 8]);
	});

	it('ne garde pas de notes par mouvement toutes vides', () => {
		const result = parseListenForm(form({ ...base, movementRating: ['', '', ''] }), 3, 2026);
		expect(result.ok && result.value.movementRatings).toEqual([]);
	});

	it('refuse une note de mouvement invalide', () => {
		const result = parseListenForm(form({ ...base, movementRating: ['12'] }), 1, 2026);
		expect(!result.ok && result.errors['movementRatings']).toBeTruthy();
	});
});

describe('parseRecordingForm', () => {
	it('lit les interprètes et une année facultative', () => {
		expect(parseRecordingForm(form({ performers: ' Fournier, Szell ', year: '' }), 2026)).toEqual({
			ok: true,
			value: { performers: 'Fournier, Szell', year: null }
		});
	});
});

describe('parseMovementsForm', () => {
	it('garde une ligne par mouvement', () => {
		expect(parseMovementsForm(form({ movements: 'Allegro\n\n Adagio \nFinale' }))).toEqual({
			ok: true,
			value: ['Allegro', 'Adagio', 'Finale']
		});
	});
});

describe('parseConcertForm', () => {
	it('lit un concert et vide les champs facultatifs', () => {
		expect(
			parseConcertForm(
				form({
					date: '2026-11-14',
					venue: ' Grand Auditório ',
					title: '',
					performers: 'Orchestre Gulbenkian',
					notes: ''
				})
			)
		).toEqual({
			ok: true,
			value: {
				date: '2026-11-14',
				venue: 'Grand Auditório',
				title: null,
				performers: 'Orchestre Gulbenkian',
				notes: null
			}
		});
	});

	it('exige date, salle et interprètes', () => {
		const result = parseConcertForm(form({ date: '', venue: '', performers: '' }));
		expect(!result.ok && Object.keys(result.errors).sort()).toEqual([
			'date',
			'performers',
			'venue'
		]);
		expect(!result.ok && result.errors['performers']).toBe('Indique les interprètes du concert.');
	});
});

describe('parseProgramItemForm', () => {
	it('garde des interprètes propres à l’œuvre, facultatifs', () => {
		expect(parseProgramItemForm(form({ workId: '4', performers: '' }))).toEqual({
			ok: true,
			value: { workId: 4, performers: null }
		});
	});
});
