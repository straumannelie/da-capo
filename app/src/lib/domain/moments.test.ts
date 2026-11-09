import { describe, expect, it } from 'vitest';
import {
	formatTimestamp,
	momentLabel,
	parseMomentLine,
	parseMoments,
	parseTimestamp,
	romanToInt,
	toRoman
} from './moments.ts';

describe('parseTimestamp', () => {
	it.each([
		['3:42', 222],
		['0:05', 5],
		['1:02:03', 3723]
	])('lit %s', (value, expected) => {
		expect(parseTimestamp(value)).toBe(expected);
	});

	it.each(['3:75', '1:60:00', '42', 'a:bc'])('refuse %s', (value) => {
		expect(parseTimestamp(value)).toBeNull();
	});
});

describe('formatTimestamp', () => {
	it('formate les minutes et les heures', () => {
		expect(formatTimestamp(222)).toBe('3:42');
		expect(formatTimestamp(3723)).toBe('1:02:03');
	});
});

describe('chiffres romains', () => {
	it('convertit dans les deux sens', () => {
		expect(romanToInt('IV')).toBe(4);
		expect(romanToInt('XIV')).toBe(14);
		expect(toRoman(9)).toBe('IX');
	});

	it('refuse les écritures non canoniques', () => {
		expect(romanToInt('IIII')).toBeNull();
		expect(romanToInt('VV')).toBeNull();
	});
});

describe('parseMomentLine', () => {
	it('lit un mouvement romain, un temps et une note', () => {
		expect(parseMomentLine('II 7:10 Dialogue avec les bois')).toEqual({
			movement: 2,
			atSeconds: 430,
			note: 'Dialogue avec les bois'
		});
	});

	it('accepte une virgule après le mouvement', () => {
		expect(parseMomentLine('I, 3:42 Le cor expose le thème')).toEqual({
			movement: 1,
			atSeconds: 222,
			note: 'Le cor expose le thème'
		});
	});

	it('lit un temps seul', () => {
		expect(parseMomentLine('3:42 - Entrée du violoncelle')).toEqual({
			movement: null,
			atSeconds: 222,
			note: 'Entrée du violoncelle'
		});
	});

	it('lit un mouvement suivi d’un point', () => {
		expect(parseMomentLine('III. Finale trop lourd')).toEqual({
			movement: 3,
			atSeconds: null,
			note: 'Finale trop lourd'
		});
	});

	it('ne prend pas un mot pour un mouvement', () => {
		expect(parseMomentLine('I love this')).toEqual({
			movement: null,
			atSeconds: null,
			note: 'I love this'
		});
		expect(parseMomentLine('1 heure plus tard')).toEqual({
			movement: null,
			atSeconds: null,
			note: '1 heure plus tard'
		});
	});

	it('garde un temps invalide dans la note', () => {
		expect(parseMomentLine('3:75 bizarre')).toEqual({
			movement: null,
			atSeconds: null,
			note: '3:75 bizarre'
		});
	});

	it('ignore les lignes vides', () => {
		expect(parseMomentLine('   ')).toBeNull();
	});
});

describe('parseMoments', () => {
	it('lit plusieurs lignes et ignore les vides', () => {
		expect(parseMoments('I 3:42 Cor\n\n7:10 Bois\r\nRéécouter au casque')).toHaveLength(3);
	});
});

describe('momentLabel', () => {
	it('combine mouvement et temps', () => {
		expect(momentLabel({ movement: 2, atSeconds: 430 })).toBe('II, 7:10');
		expect(momentLabel({ movement: null, atSeconds: 430 })).toBe('7:10');
		expect(momentLabel({ movement: null, atSeconds: null })).toBe('');
	});
});
