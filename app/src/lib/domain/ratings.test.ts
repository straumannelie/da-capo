import { describe, expect, it } from 'vitest';
import { coverage, summarizeRecording, workRating } from './ratings.ts';

describe('summarizeRecording', () => {
	it('retient la dernière écoute et la moyenne', () => {
		const summary = summarizeRecording([
			{ id: 1, listenedOn: '2026-10-18', rating: 8, movementRatings: [] },
			{ id: 2, listenedOn: '2026-11-03', rating: 9, movementRatings: [9, 10, 8] },
			{ id: 3, listenedOn: '2026-10-01', rating: 6, movementRatings: [] }
		]);
		expect(summary).toEqual({
			listenCount: 3,
			latestRating: 9,
			latestMovementRatings: [9, 10, 8],
			averageRating: 7.7,
			lastListenedOn: '2026-11-03'
		});
	});

	it('départage deux écoutes du même jour par ordre de saisie', () => {
		const summary = summarizeRecording([
			{ id: 4, listenedOn: '2026-11-03', rating: 5, movementRatings: [] },
			{ id: 7, listenedOn: '2026-11-03', rating: 7, movementRatings: [] }
		]);
		expect(summary.latestRating).toBe(7);
	});

	it('gère une version jamais écoutée', () => {
		expect(summarizeRecording([]).latestRating).toBeNull();
	});
});

describe('workRating', () => {
	const summary = (latestRating: number | null, lastListenedOn: string | null) => ({
		listenCount: latestRating === null ? 0 : 1,
		latestRating,
		latestMovementRatings: [],
		averageRating: latestRating,
		lastListenedOn
	});

	it('préfère la version de référence', () => {
		expect(
			workRating([
				{ isReference: false, summary: summary(6, '2026-11-05') },
				{ isReference: true, summary: summary(9, '2026-10-01') }
			])
		).toBe(9);
	});

	it('prend sinon la version écoutée le plus récemment', () => {
		expect(
			workRating([
				{ isReference: false, summary: summary(6, '2026-10-01') },
				{ isReference: false, summary: summary(8, '2026-11-05') },
				{ isReference: true, summary: summary(null, null) }
			])
		).toBe(8);
	});

	it('renvoie null sans écoute', () => {
		expect(workRating([])).toBeNull();
	});
});

describe('coverage', () => {
	it('compte les œuvres phares écoutées', () => {
		expect(
			coverage([
				{ popular: true, listened: true },
				{ popular: true, listened: false },
				{ popular: false, listened: true }
			])
		).toEqual({ listened: 1, total: 2, ratio: 0.5 });
	});

	it('vaut zéro sans œuvre phare', () => {
		expect(coverage([]).ratio).toBe(0);
	});
});
