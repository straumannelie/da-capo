import { describe, expect, it } from 'vitest';
import { epochLabel, periodOf } from './periods.ts';

describe('périodes', () => {
	it('regroupe les époques Open Opus', () => {
		expect(periodOf('Early Romantic').id).toBe('romantique');
		expect(periodOf('Post-War').id).toBe('moderne');
	});

	it('se rabat sur la date pour une époque inconnue', () => {
		expect(periodOf('Inconnue', 1740).id).toBe('classique');
		expect(periodOf('Inconnue').id).toBe('moderne');
	});

	it('traduit les époques', () => {
		expect(epochLabel('Late Romantic')).toBe('Romantisme tardif');
		expect(epochLabel('Inconnue')).toBe('Inconnue');
	});
});
