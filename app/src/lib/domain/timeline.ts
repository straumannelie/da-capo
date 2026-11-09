import { PERIODS, periodOf } from './periods.ts';

export interface LifeSpan {
	readonly birthYear: number;
	readonly deathYear: number | null;
	readonly epoch: string;
	readonly listened: boolean;
	readonly name: string;
}

export interface Placement {
	readonly left: number;
	readonly width: number;
	readonly end: number;
	readonly color: string;
	readonly alive: boolean;
}

export interface TimelineBand {
	readonly id: string;
	readonly label: string;
	readonly color: string;
	readonly left: number;
	readonly width: number;
}

export interface TimelineTick {
	readonly year: number;
	readonly left: number;
}

export interface Timeline<T extends LifeSpan> {
	readonly start: number;
	readonly end: number;
	readonly rows: readonly (T & Placement)[];
	readonly bands: readonly TimelineBand[];
	readonly ticks: readonly TimelineTick[];
}

const EMPTY_RANGE = { start: 1600, end: 2000 } as const;

function round(value: number): number {
	return Math.round(value * 100) / 100;
}

export function timelineRange(
	spans: readonly LifeSpan[],
	currentYear: number
): { start: number; end: number } {
	if (spans.length === 0) {
		return EMPTY_RANGE;
	}
	const firstBirth = Math.min(...spans.map((span) => span.birthYear));
	const lastYear = Math.max(...spans.map((span) => span.deathYear ?? currentYear));
	return {
		start: Math.floor((firstBirth - 10) / 50) * 50,
		end: Math.ceil((lastYear + 10) / 50) * 50
	};
}

export function buildTimeline<T extends LifeSpan>(
	spans: readonly T[],
	currentYear: number
): Timeline<T> {
	const { start, end } = timelineRange(spans, currentYear);
	const span = end - start;
	const toPercent = (year: number): number => round(((year - start) / span) * 100);

	const rows = [...spans]
		.sort((a, b) => a.birthYear - b.birthYear || a.name.localeCompare(b.name, 'fr'))
		.map((item) => {
			const lastYear = item.deathYear ?? currentYear;
			const left = toPercent(item.birthYear);
			const endPercent = toPercent(lastYear);
			return {
				...item,
				left,
				width: round(endPercent - left),
				end: endPercent,
				color: periodOf(item.epoch, item.birthYear).color,
				alive: item.deathYear === null
			};
		});

	const bands = PERIODS.flatMap((period) => {
		const from = Math.max(period.from, start);
		const to = Math.min(period.to, end);
		if (to <= from) {
			return [];
		}
		return [
			{
				id: period.id,
				label: period.label,
				color: period.color,
				left: toPercent(from),
				width: round(toPercent(to) - toPercent(from))
			}
		];
	});

	const step = span > 250 ? 50 : 25;
	const ticks: TimelineTick[] = [];
	for (let year = start; year < end; year += step) {
		ticks.push({ year, left: toPercent(year) });
	}

	return { start, end, rows, bands, ticks };
}
