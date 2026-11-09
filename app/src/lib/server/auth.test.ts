import { describe, expect, it } from 'vitest';
import { isValidSession, passwordMatches, safeRedirectTarget, sessionToken } from './auth.ts';

describe('auth', () => {
	const secret = 'un-secret-de-test-suffisamment-long-pour-signer';

	it('valide un cookie signé avec le bon secret', () => {
		expect(isValidSession(sessionToken(secret), secret)).toBe(true);
		expect(isValidSession(sessionToken('autre-secret-de-test-tout-aussi-long-xx'), secret)).toBe(
			false
		);
		expect(isValidSession(undefined, secret)).toBe(false);
	});

	it('compare les mots de passe', () => {
		expect(passwordMatches('violoncelle', 'violoncelle')).toBe(true);
		expect(passwordMatches('violon', 'violoncelle')).toBe(false);
	});

	it('n’autorise que les redirections internes', () => {
		expect(safeRedirectTarget('/oeuvres/3')).toBe('/oeuvres/3');
		expect(safeRedirectTarget('//exemple.com')).toBe('/');
		expect(safeRedirectTarget('https://exemple.com')).toBe('/');
		expect(safeRedirectTarget(null)).toBe('/');
	});
});
