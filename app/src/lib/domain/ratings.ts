export interface RatedListen {
	readonly id: number;
	readonly listenedOn: string;
	readonly rating: number;
	readonly movementRatings: readonly (number | null)[];
}

export interface RecordingSummary {
	readonly listenCount: number;
	readonly latestRating: number | null;
	readonly latestMovementRatings: readonly (number | null)[];
	readonly averageRating: number | null;
	readonly lastListenedOn: string | null;
}

export interface SummarizedRecording {
	readonly isReference: boolean;
	readonly summary: RecordingSummary;
}

export interface Coverage {
	readonly listened: number;
	readonly total: number;
	readonly ratio: number;
}

export function compareListensDesc(
	a: Pick<RatedListen, 'listenedOn' | 'id'>,
	b: Pick<RatedListen, 'listenedOn' | 'id'>
): number {
	return b.listenedOn.localeCompare(a.listenedOn) || b.id - a.id;
}

export function summarizeRecording(listens: readonly RatedListen[]): RecordingSummary {
	const [latest] = [...listens].sort(compareListensDesc);
	if (!latest) {
		return {
			listenCount: 0,
			latestRating: null,
			latestMovementRatings: [],
			averageRating: null,
			lastListenedOn: null
		};
	}
	const total = listens.reduce((sum, listen) => sum + listen.rating, 0);
	return {
		listenCount: listens.length,
		latestRating: latest.rating,
		latestMovementRatings: latest.movementRatings,
		averageRating: Math.round((total / listens.length) * 10) / 10,
		lastListenedOn: latest.listenedOn
	};
}

export function workRating(recordings: readonly SummarizedRecording[]): number | null {
	const listened = recordings.filter((recording) => recording.summary.latestRating !== null);
	const reference = listened.find((recording) => recording.isReference);
	if (reference) {
		return reference.summary.latestRating;
	}
	const [mostRecent] = [...listened].sort((a, b) =>
		(b.summary.lastListenedOn ?? '').localeCompare(a.summary.lastListenedOn ?? '')
	);
	return mostRecent?.summary.latestRating ?? null;
}

export function coverage(works: readonly { popular: boolean; listened: boolean }[]): Coverage {
	const popular = works.filter((work) => work.popular);
	const listened = popular.filter((work) => work.listened).length;
	return {
		listened,
		total: popular.length,
		ratio: popular.length === 0 ? 0 : listened / popular.length
	};
}
