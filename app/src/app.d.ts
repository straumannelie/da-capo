import type { Database } from '#lib/server/db/client.ts';

declare global {
	namespace App {
		interface Locals {
			db: Database;
			authEnabled: boolean;
		}
	}
}

export {};
