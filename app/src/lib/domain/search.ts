export function normalizeSearch(value: string): string {
	return value
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
		.trim();
}

export function searchTerms(query: string): string[] {
	return normalizeSearch(query)
		.split(' ')
		.filter((term) => term !== '')
		.slice(0, 8);
}

export function searchText(parts: readonly (string | null | undefined)[]): string {
	return normalizeSearch(parts.filter((part): part is string => Boolean(part)).join(' '));
}

export function matchesSearch(haystack: string, query: string): boolean {
	const normalized = normalizeSearch(haystack);
	return searchTerms(query).every((term) => normalized.includes(term));
}
