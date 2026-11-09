const longDate = new Intl.DateTimeFormat('fr-FR', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	timeZone: 'UTC'
});

const shortDate = new Intl.DateTimeFormat('fr-FR', {
	day: 'numeric',
	month: 'short',
	timeZone: 'UTC'
});

const shortDateWithYear = new Intl.DateTimeFormat('fr-FR', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'UTC'
});

function toDate(iso: string): Date {
	return new Date(`${iso}T00:00:00Z`);
}

export function formatDate(iso: string): string {
	return longDate.format(toDate(iso));
}

export function formatShortDate(iso: string, referenceYear: number): string {
	const date = toDate(iso);
	return date.getUTCFullYear() === referenceYear
		? shortDate.format(date)
		: shortDateWithYear.format(date);
}

export function todayIso(now: Date = new Date()): string {
	return now.toISOString().slice(0, 10);
}

export function countLabel(count: number, singular: string, plural: string): string {
	return `${count} ${count === 1 ? singular : plural}`;
}

export function lifeYears(birthYear: number | null, deathYear: number | null): string {
	if (birthYear === null) {
		return deathYear === null ? '' : `?–${deathYear}`;
	}
	return deathYear === null ? `${birthYear}–` : `${birthYear}–${deathYear}`;
}

export function lifeEvent(year: number | null, place: string | null): string | null {
	if (year === null) {
		return place;
	}
	return place === null ? String(year) : `${year}, ${place}`;
}
