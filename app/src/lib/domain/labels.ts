export type RelationType = 'eleve_de' | 'influence_par';
export type RelationDirection = 'outgoing' | 'incoming';

const GENRE_LABELS: Readonly<Record<string, string>> = {
	Chamber: 'Musique de chambre',
	Keyboard: 'Clavier',
	Orchestral: 'Orchestre',
	Stage: 'Scène',
	Vocal: 'Voix'
};

const RELATION_LABELS: Readonly<Record<RelationType, Record<RelationDirection, string>>> = {
	eleve_de: { outgoing: 'Son maître', incoming: 'Son élève' },
	influence_par: { outgoing: 'Une influence', incoming: 'Sous son influence' }
};

export function genreLabel(genre: string | null): string | null {
	if (genre === null) {
		return null;
	}
	return GENRE_LABELS[genre] ?? genre;
}

export function relationLabel(type: RelationType, direction: RelationDirection): string {
	return RELATION_LABELS[type][direction];
}

export function workTitle(work: { title: string; titleFr: string | null }): string {
	return work.titleFr ?? work.title;
}
