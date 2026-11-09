export type PeriodId = 'ancienne' | 'baroque' | 'classique' | 'romantique' | 'moderne';

export interface Period {
	readonly id: PeriodId;
	readonly label: string;
	readonly color: string;
	readonly from: number;
	readonly to: number;
}

export const PERIODS: readonly Period[] = [
	{ id: 'ancienne', label: 'Musique ancienne', color: '#6E7B4E', from: 1000, to: 1600 },
	{ id: 'baroque', label: 'Baroque', color: '#B48A3A', from: 1600, to: 1750 },
	{ id: 'classique', label: 'Classique', color: '#5B7FA6', from: 1750, to: 1820 },
	{ id: 'romantique', label: 'Romantique', color: '#8E2F45', from: 1820, to: 1900 },
	{ id: 'moderne', label: 'XXe et XXIe', color: '#3B3452', from: 1900, to: 2100 }
];

const EPOCHS = {
	Medieval: { label: 'Médiéval', period: 'ancienne' },
	Renaissance: { label: 'Renaissance', period: 'ancienne' },
	Baroque: { label: 'Baroque', period: 'baroque' },
	Classical: { label: 'Classique', period: 'classique' },
	'Early Romantic': { label: 'Premier romantisme', period: 'romantique' },
	Romantic: { label: 'Romantique', period: 'romantique' },
	'Late Romantic': { label: 'Romantisme tardif', period: 'romantique' },
	'20th Century': { label: 'XXe siècle', period: 'moderne' },
	'Post-War': { label: 'Après-guerre', period: 'moderne' },
	'21st Century': { label: 'XXIe siècle', period: 'moderne' }
} as const satisfies Record<string, { label: string; period: PeriodId }>;

type KnownEpoch = keyof typeof EPOCHS;

function isKnownEpoch(epoch: string): epoch is KnownEpoch {
	return Object.hasOwn(EPOCHS, epoch);
}

export function periodById(id: PeriodId): Period {
	const period = PERIODS.find((candidate) => candidate.id === id);
	if (!period) {
		throw new Error(`Période inconnue : ${id}`);
	}
	return period;
}

export function periodOfYear(year: number): Period {
	return PERIODS.find((period) => year < period.to) ?? periodById('moderne');
}

export function periodOf(epoch: string, birthYear: number | null = null): Period {
	if (isKnownEpoch(epoch)) {
		return periodById(EPOCHS[epoch].period);
	}
	return birthYear === null ? periodById('moderne') : periodOfYear(birthYear + 30);
}

export function epochLabel(epoch: string): string {
	return isKnownEpoch(epoch) ? EPOCHS[epoch].label : epoch;
}
