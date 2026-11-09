import { describe, expect, it } from 'vitest';
import {
	buildHeatmap,
	buildStatistics,
	ratingDistribution,
	splitPerformers,
	type ListenFact
} from './stats.ts';

const fact = (overrides: Partial<ListenFact>): ListenFact => ({
	listenedOn: '2026-11-03',
	rating: 8,
	performers: 'Rostropovitch, Berliner Philharmoniker, Karajan',
	inConcert: false,
	workId: 1,
	genre: 'Orchestral',
	composerId: 10,
	composerName: 'Dvořák',
	epoch: 'Romantic',
	birthYear: 1841,
	...overrides
});

describe('buildHeatmap', () => {
	const heatmap = buildHeatmap(
		['2026-11-09', '2026-11-09', '2026-11-03', '2025-01-01', '2026-12-01'],
		'2026-11-09'
	);

	it('commence un lundi et s’arrête aujourd’hui', () => {
		expect(heatmap.weeks).toHaveLength(52);
		expect(heatmap.weeks[0]?.[0]?.date).toBe('2025-11-17');
		expect(heatmap.weeks.at(-1)?.at(-1)?.date).toBe('2026-11-09');
		expect(heatmap.weeks.at(-1)).toHaveLength(1);
	});

	it('ignore les dates hors fenêtre et gradue l’intensité', () => {
		expect(heatmap.total).toBe(3);
		expect(heatmap.activeDays).toBe(2);
		expect(heatmap.weeks.at(-1)?.at(-1)).toMatchObject({ count: 2, level: 4 });
		expect(heatmap.weeks.at(-2)?.[0]).toMatchObject({ date: '2026-11-02', count: 0, level: 0 });
		expect(heatmap.weeks.at(-2)?.[1]).toMatchObject({ date: '2026-11-03', count: 1, level: 2 });
	});

	it('repère le début de chaque mois sans chevauchement', () => {
		expect(heatmap.months[0]).toEqual({ week: 2, label: 'déc.' });
		expect(heatmap.months.map((month) => month.label)).toContain('janv.');
		expect(new Set(heatmap.months.map((month) => month.week)).size).toBe(heatmap.months.length);
	});
});

describe('ratingDistribution', () => {
	it('compte chaque note et calcule la moyenne', () => {
		const distribution = ratingDistribution([9, 9, 8, 6]);
		expect(distribution.average).toBe(8);
		expect(distribution.counts[8]).toEqual({ rating: 9, count: 2, ratio: 1 });
		expect(distribution.counts[7]?.ratio).toBe(0.5);
	});

	it('gère l’absence de note', () => {
		expect(ratingDistribution([]).average).toBeNull();
	});
});

describe('splitPerformers', () => {
	it('découpe les interprètes saisis en texte libre', () => {
		expect(splitPerformers('Rostropovitch, Berliner Philharmoniker ; Karajan')).toEqual([
			'Rostropovitch',
			'Berliner Philharmoniker',
			'Karajan'
		]);
	});
});

describe('buildStatistics', () => {
	const stats = buildStatistics(
		[
			fact({}),
			fact({ listenedOn: '2026-11-05', rating: 10, inConcert: true }),
			fact({
				workId: 2,
				composerId: 11,
				composerName: 'Bach',
				epoch: 'Baroque',
				birthYear: 1685,
				genre: 'Chamber',
				performers: 'Pierre Fournier'
			})
		],
		'2026-11-09'
	);

	it('compte écoutes, œuvres, compositeurs et concerts', () => {
		expect(stats.totals).toEqual({ listens: 3, works: 2, composers: 2, concertListens: 1 });
	});

	it('répartit par période dans l’ordre chronologique', () => {
		expect(stats.periods.map((period) => [period.key, period.count])).toEqual([
			['ancienne', 0],
			['baroque', 1],
			['classique', 0],
			['romantique', 2],
			['moderne', 0]
		]);
	});

	it('classe compositeurs, genres et interprètes', () => {
		expect(stats.composers.map((composer) => [composer.label, composer.count])).toEqual([
			['Dvořák', 2],
			['Bach', 1]
		]);
		expect(stats.genres[0]).toMatchObject({ label: 'Orchestre', count: 2, ratio: 1 });
		expect(stats.performers[0]).toMatchObject({ label: 'Rostropovitch', count: 2 });
	});
});
