import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { dev } from '$app/env';
import { APP_PASSWORD, SESSION_SECRET } from '$app/env/private';
import { SESSION_COOKIE, isValidSession } from '#lib/server/auth.ts';
import { getDb } from '#lib/server/db/index.ts';

const PUBLIC_PATHS = new Set(['/connexion']);

export const handle: Handle = async ({ event, resolve }) => {
	const authEnabled = APP_PASSWORD !== undefined;
	if ((!dev && !authEnabled) || (authEnabled && SESSION_SECRET === undefined)) {
		return new Response('Configuration incomplète : définis APP_PASSWORD et SESSION_SECRET.', {
			status: 500
		});
	}

	if (
		authEnabled &&
		!PUBLIC_PATHS.has(event.url.pathname) &&
		!isValidSession(event.cookies.get(SESSION_COOKIE), SESSION_SECRET)
	) {
		const target = `${event.url.pathname}${event.url.search}`;
		redirect(303, target === '/' ? '/connexion' : `/connexion?suite=${encodeURIComponent(target)}`);
	}

	event.locals.db = await getDb();
	event.locals.authEnabled = authEnabled;
	return resolve(event);
};
