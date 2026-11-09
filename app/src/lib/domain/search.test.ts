import { describe, expect, it } from 'vitest';
import { matchesSearch, normalizeSearch, searchTerms, searchText } from './search.ts';

describe('recherche', () => {
	it('ignore accents, casse et ponctuation', () => {
		expect(normalizeSearch('Antonín  Dvořák, op. 104')).toBe('antonin dvorak op 104');
	});

	it('découpe la requête en termes', () => {
		expect(searchTerms('  Dvořák concerto ')).toEqual(['dvorak', 'concerto']);
	});

	it('assemble le texte indexé sans les valeurs vides', () => {
		expect(searchText(['Cello Concerto', null, 'Antonín Dvořák'])).toBe(
			'cello concerto antonin dvorak'
		);
	});

	it('exige que chaque terme soit présent', () => {
		expect(matchesSearch('Antonín Dvořák', 'dvorak anton')).toBe(true);
		expect(matchesSearch('Antonín Dvořák', 'dvorak bach')).toBe(false);
	});
});
