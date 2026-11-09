import { PERIODS, periodOf } from '#lib/domain/periods.ts';
import { listComposers } from '#lib/server/repo/composers.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const query = url.searchParams.get('q') ?? '';
	const composers = await listComposers(locals.db, query);
	const groups = PERIODS.map((period) => ({
		id: period.id,
		label: period.label,
		color: period.color,
		composers: composers.filter(
			(composer) => periodOf(composer.epoch, composer.birthYear).id === period.id
		)
	})).filter((group) => group.composers.length > 0);
	return { query, groups, total: composers.length };
};
