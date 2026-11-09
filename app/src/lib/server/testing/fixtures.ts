import type { ReferenceData } from '../reference.ts';

export const referenceFixture: ReferenceData = {
	version: 1,
	generated_at: '2026-11-09T10:00:00+00:00',
	composers: [
		{
			open_opus_id: 80,
			name: 'Brahms',
			complete_name: 'Johannes Brahms',
			birth_year: 1833,
			death_year: 1897,
			epoch: 'Romantic',
			popular: true,
			recommended: true,
			wikidata_id: 'Q7294',
			birth_place: 'Hambourg',
			death_place: 'Vienne',
			bio: 'Compositeur allemand.',
			bio_url: 'https://fr.wikipedia.org/wiki/Johannes_Brahms'
		},
		{
			open_opus_id: 112,
			name: 'Dvořák',
			complete_name: 'Antonín Dvořák',
			birth_year: 1841,
			death_year: 1904,
			epoch: 'Romantic',
			popular: true,
			recommended: true,
			wikidata_id: 'Q7298',
			birth_place: 'Nelahozeves',
			death_place: 'Prague',
			bio: 'Compositeur tchèque.',
			bio_url: 'https://fr.wikipedia.org/wiki/Anton%C3%ADn_Dvo%C5%99%C3%A1k'
		},
		{
			open_opus_id: 300,
			name: 'Suk',
			complete_name: 'Josef Suk',
			birth_year: 1874,
			death_year: 1935,
			epoch: '20th Century',
			popular: false,
			recommended: false,
			wikidata_id: null,
			birth_place: null,
			death_place: null,
			bio: null,
			bio_url: null
		}
	],
	works: [
		{
			open_opus_id: 9001,
			composer_open_opus_id: 112,
			title: 'Cello Concerto in B minor, op. 104',
			title_fr: 'Concerto pour violoncelle en si mineur, op. 104',
			subtitle: null,
			genre: 'Orchestral',
			popular: true,
			recommended: true
		},
		{
			open_opus_id: 9002,
			composer_open_opus_id: 112,
			title: 'Symphony no. 9 in E minor, op. 95, "From the New World"',
			title_fr: 'Symphonie n° 9 en mi mineur, op. 95, « From the New World »',
			subtitle: null,
			genre: 'Orchestral',
			popular: true,
			recommended: true
		},
		{
			open_opus_id: 9003,
			composer_open_opus_id: 112,
			title: 'Piano Trio no. 4 in E minor, op. 90, "Dumky"',
			title_fr: null,
			subtitle: null,
			genre: 'Chamber',
			popular: false,
			recommended: true
		},
		{
			open_opus_id: 9004,
			composer_open_opus_id: 999,
			title: 'Orphan',
			title_fr: null,
			subtitle: null,
			genre: null,
			popular: false,
			recommended: false
		}
	],
	relations: [
		{ from_open_opus_id: 300, to_open_opus_id: 112, type: 'eleve_de' },
		{ from_open_opus_id: 112, to_open_opus_id: 80, type: 'influence_par' }
	]
};
