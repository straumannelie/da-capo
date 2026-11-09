import { fail, redirect } from '@sveltejs/kit';
import { setTimeout as delay } from 'node:timers/promises';
import { dev } from '$app/env';
import { APP_PASSWORD, SESSION_SECRET } from '$app/env/private';
import {
	SESSION_COOKIE,
	SESSION_MAX_AGE,
	passwordMatches,
	safeRedirectTarget,
	sessionToken
} from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.authEnabled) {
		redirect(303, '/');
	}
};

export const actions: Actions = {
	default: async ({ cookies, request, url }) => {
		if (APP_PASSWORD === undefined || SESSION_SECRET === undefined) {
			redirect(303, '/');
		}
		const password = (await request.formData()).get('password');
		if (typeof password !== 'string' || !passwordMatches(password, APP_PASSWORD)) {
			await delay(600);
			return fail(400, { error: 'Mot de passe incorrect.' });
		}
		cookies.set(SESSION_COOKIE, sessionToken(SESSION_SECRET), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: SESSION_MAX_AGE
		});
		redirect(303, safeRedirectTarget(url.searchParams.get('suite')));
	}
};
