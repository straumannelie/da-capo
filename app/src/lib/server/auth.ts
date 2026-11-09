import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'da_capo_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90;

function digest(value: string): Buffer {
	return createHash('sha256').update(value).digest();
}

export function sessionToken(secret: string): string {
	return createHmac('sha256', secret).update('da-capo:session:v1').digest('base64url');
}

export function isValidSession(cookie: string | undefined, secret: string | undefined): boolean {
	if (cookie === undefined || secret === undefined) {
		return false;
	}
	return timingSafeEqual(digest(cookie), digest(sessionToken(secret)));
}

export function passwordMatches(candidate: string, expected: string): boolean {
	return timingSafeEqual(digest(candidate), digest(expected));
}

export function safeRedirectTarget(target: string | null): string {
	if (target === null || !target.startsWith('/') || target.startsWith('//')) {
		return '/';
	}
	return target;
}
