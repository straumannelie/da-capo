import { describe, expect, it } from 'vitest';
import { buildTimeline, timelineRange } from './timeline.ts';

const bach = { name: 'Bach', birthYear: 1685, deathYear: 1750, epoch: 'Baroque', listened: true };
const dvorak = {
	name: 'Dvořák',
	birthYear: 1841,
	deathYear: 1904,
	epoch: 'Romantic',
	listened: false
};
const adams = {
	name: 'Adams',
	birthYear: 1947,
	deathYear: null,
	epoch: '21st Century',
	listened: false
};

describe('timelineRange', () => {
	it('arrondit à la demi-décennie de siècle', () => {
		expect(timelineRange([bach, dvorak], 2026)).toEqual({ start: 1650, end: 1950 });
	});

	it('prolonge les vivants jusqu’à l’année courante', () => {
		expect(timelineRange([adams], 2026).end).toBe(2050);
	});

	it('a une plage par défaut quand la frise est vide', () => {
		expect(timelineRange([], 2026)).toEqual({ start: 1600, end: 2000 });
	});
});

describe('buildTimeline', () => {
	const timeline = buildTimeline([dvorak, bach, adams], 2026);

	it('trie par naissance', () => {
		expect(timeline.rows.map((row) => row.name)).toEqual(['Bach', 'Dvořák', 'Adams']);
	});

	it('place chaque vie en pourcentage de la frise', () => {
		const [first] = timeline.rows;
		expect(timeline.start).toBe(1650);
		expect(timeline.end).toBe(2050);
		expect(first?.left).toBe(8.75);
		expect(first?.width).toBe(16.25);
		expect(first?.end).toBe(25);
	});

	it('colore selon la période et marque les vivants', () => {
		expect(timeline.rows[0]?.color).toBe('#B48A3A');
		expect(timeline.rows[2]?.alive).toBe(true);
	});

	it('découpe les bandes de période sur la plage', () => {
		expect(timeline.bands.map((band) => band.id)).toEqual([
			'baroque',
			'classique',
			'romantique',
			'moderne'
		]);
		expect(timeline.bands[0]).toMatchObject({ left: 0, width: 25 });
	});

	it('pose une graduation tous les 50 ans sans dépasser la fin', () => {
		expect(timeline.ticks.at(0)?.year).toBe(1650);
		expect(timeline.ticks.at(-1)?.year).toBe(2000);
	});
});
