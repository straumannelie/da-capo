import { describe, expect, it } from 'vitest';
import { countLabel, formatDate, formatShortDate, lifeEvent, lifeYears } from './format.ts';

describe('formatage', () => {
	it('écrit les dates en français', () => {
		expect(formatDate('2026-11-03')).toBe('3 novembre 2026');
		expect(formatShortDate('2026-11-03', 2026)).toBe('3 nov.');
		expect(formatShortDate('2025-11-03', 2026)).toBe('3 nov. 2025');
	});

	it('accorde les compteurs', () => {
		expect(countLabel(1, 'écoute', 'écoutes')).toBe('1 écoute');
		expect(countLabel(4, 'écoute', 'écoutes')).toBe('4 écoutes');
	});

	it('écrit les années de vie', () => {
		expect(lifeYears(1841, 1904)).toBe('1841–1904');
		expect(lifeYears(1947, null)).toBe('1947–');
	});

	it('décrit une naissance ou une mort', () => {
		expect(lifeEvent(1841, 'Nelahozeves')).toBe('1841, Nelahozeves');
		expect(lifeEvent(1841, null)).toBe('1841');
		expect(lifeEvent(null, null)).toBeNull();
	});
});
