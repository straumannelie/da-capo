import { genreLabel } from './labels.ts';
import { PERIODS, periodOf, type PeriodId } from './periods.ts';
import { normalizeSearch } from './search.ts';

export interface ListenFact {
	readonly listenedOn: string;
	readonly rating: number;
	readonly performers: string;
	readonly inConcert: boolean;
	readonly workId: number;
	readonly genre: string | null;
	readonly composerId: number;
	readonly composerName: string;
	readonly epoch: string;
	readonly birthYear: number | null;
}

export interface HeatmapDay {
	readonly date: string;
	readonly count: number;
	readonly level: 0 | 1 | 2 | 3 | 4;
}

export interface Heatmap {
	readonly weeks: readonly (readonly HeatmapDay[])[];
	readonly months: readonly { readonly week: number; readonly label: string }[];
	readonly activeDays: number;
	readonly total: number;
}

export interface Share {
	readonly key: string;
	readonly label: string;
	readonly count: number;
	readonly ratio: number;
	readonly color?: string;
}

export interface RatingDistribution {
	readonly counts: readonly {
		readonly rating: number;
		readonly count: number;
		readonly ratio: number;
	}[];
	readonly average: number | null;
	readonly total: number;
}

export interface Statistics {
	readonly totals: {
		readonly listens: number;
		readonly works: number;
		readonly composers: number;
		readonly concertListens: number;
	};
	readonly heatmap: Heatmap;
	readonly periods: readonly Share[];
	readonly genres: readonly Share[];
	readonly ratings: RatingDistribution;
	readonly composers: readonly (Share & { readonly id: number })[];
	readonly performers: readonly Share[];
}

const DAY_MS = 86_400_000;

const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'short', timeZone: 'UTC' });

function parseDay(iso: string): Date {
	return new Date(`${iso}T00:00:00Z`);
}

function toIso(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function level(count: number, max: number): HeatmapDay['level'] {
	if (count === 0 || max === 0) {
		return 0;
	}
	return Math.min(4, Math.max(1, Math.ceil((count / max) * 4))) as HeatmapDay['level'];
}

export function buildHeatmap(dates: readonly string[], today: string, weekCount = 52): Heatmap {
	const end = parseDay(today);
	const mondayOffset = (end.getUTCDay() + 6) % 7;
	const start = new Date(end.getTime() - (mondayOffset + (weekCount - 1) * 7) * DAY_MS);
	const startIso = toIso(start);

	const counts = new Map<string, number>();
	for (const date of dates) {
		if (date >= startIso && date <= today) {
			counts.set(date, (counts.get(date) ?? 0) + 1);
		}
	}
	const max = Math.max(0, ...counts.values());

	const weeks: HeatmapDay[][] = [];
	const months: { week: number; label: string }[] = [];
	for (let cursor = start; cursor <= end; cursor = new Date(cursor.getTime() + DAY_MS)) {
		const date = toIso(cursor);
		const weekIndex = Math.floor((cursor.getTime() - start.getTime()) / (7 * DAY_MS));
		const week = (weeks[weekIndex] ??= []);
		const count = counts.get(date) ?? 0;
		week.push({ date, count, level: level(count, max) });
		if (cursor.getUTCDate() === 1 || (weekIndex === 0 && week.length === 1)) {
			if (months.at(-1)?.week !== weekIndex) {
				months.push({ week: weekIndex, label: monthFormat.format(cursor) });
			}
		}
	}

	const [first, second] = months;
	if (first && second && second.week - first.week < 3) {
		months.shift();
	}

	return {
		weeks,
		months,
		activeDays: counts.size,
		total: [...counts.values()].reduce((sum, count) => sum + count, 0)
	};
}

export function ratingDistribution(ratings: readonly number[]): RatingDistribution {
	const counts = Array.from({ length: 10 }, (_, index) => ({
		rating: index + 1,
		count: ratings.filter((rating) => rating === index + 1).length
	}));
	const max = Math.max(0, ...counts.map((entry) => entry.count));
	const total = ratings.length;
	return {
		counts: counts.map((entry) => ({ ...entry, ratio: max === 0 ? 0 : entry.count / max })),
		average:
			total === 0
				? null
				: Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / total) * 10) / 10,
		total
	};
}

export function splitPerformers(performers: string): string[] {
	return performers
		.split(/[,;/]/u)
		.map((part) => part.trim())
		.filter((part) => part.length > 1);
}

function ranked<T extends { count: number }>(
	entries: Iterable<T>,
	limit: number
): (T & { ratio: number })[] {
	const sorted = [...entries].sort((a, b) => b.count - a.count).slice(0, limit);
	const max = sorted[0]?.count ?? 0;
	return sorted.map((entry) => ({ ...entry, ratio: max === 0 ? 0 : entry.count / max }));
}

function tally<T>(
	facts: readonly ListenFact[],
	keyOf: (fact: ListenFact) => T | null
): Map<T, number> {
	const counts = new Map<T, number>();
	for (const fact of facts) {
		const key = keyOf(fact);
		if (key !== null) {
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
	}
	return counts;
}

export function buildStatistics(facts: readonly ListenFact[], today: string): Statistics {
	const periodCounts = tally(facts, (fact) => periodOf(fact.epoch, fact.birthYear).id);
	const periodMax = Math.max(0, ...periodCounts.values());
	const periods = PERIODS.map((period) => {
		const count = periodCounts.get(period.id) ?? 0;
		return {
			key: period.id satisfies PeriodId,
			label: period.label,
			color: period.color,
			count,
			ratio: periodMax === 0 ? 0 : count / periodMax
		};
	});

	const genres = ranked(
		[...tally(facts, (fact) => fact.genre)].map(([genre, count]) => ({
			key: genre,
			label: genreLabel(genre) ?? genre,
			count
		})),
		6
	);

	const composerNames = new Map(facts.map((fact) => [fact.composerId, fact]));
	const composers = ranked(
		[...tally(facts, (fact) => fact.composerId)].map(([id, count]) => {
			const fact = composerNames.get(id);
			return {
				id,
				key: String(id),
				label: fact?.composerName ?? '',
				color: fact ? periodOf(fact.epoch, fact.birthYear).color : undefined,
				count
			};
		}),
		8
	);

	const performerCounts = new Map<string, { label: string; count: number }>();
	for (const fact of facts) {
		for (const name of new Set(splitPerformers(fact.performers))) {
			const key = normalizeSearch(name);
			const entry = performerCounts.get(key) ?? { label: name, count: 0 };
			entry.count += 1;
			performerCounts.set(key, entry);
		}
	}
	const performers = ranked(
		[...performerCounts].map(([key, entry]) => ({ key, ...entry })),
		8
	);

	return {
		totals: {
			listens: facts.length,
			works: new Set(facts.map((fact) => fact.workId)).size,
			composers: new Set(facts.map((fact) => fact.composerId)).size,
			concertListens: facts.filter((fact) => fact.inConcert).length
		},
		heatmap: buildHeatmap(
			facts.map((fact) => fact.listenedOn),
			today
		),
		periods,
		genres,
		ratings: ratingDistribution(facts.map((fact) => fact.rating)),
		composers,
		performers
	};
}
