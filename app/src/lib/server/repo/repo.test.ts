import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseHandle } from '../db/client.ts';
import { works } from '../db/schema.ts';
import { importReference } from '../reference.ts';
import { createTestDatabase } from '../testing/database.ts';
import { referenceFixture } from '../testing/fixtures.ts';
import { getComposerDetail, listTimelineComposers, searchComposerWorks } from './composers.ts';
import { createListen, listJournal, listRecentListens } from './listens.ts';
import { addRecording, setReference } from './recordings.ts';
import { getWorkDetail, listWatchlist, searchWorks, setWatchlisted } from './works.ts';

async function workId(handle: DatabaseHandle, openOpusId: number): Promise<number> {
	const [row] = await handle.db
		.select({ id: works.id })
		.from(works)
		.where(eq(works.openOpusId, openOpusId));
	if (!row) {
		throw new Error(`Œuvre ${openOpusId} absente`);
	}
	return row.id;
}

describe('dépôts', () => {
	let handle: DatabaseHandle;
	let concertoId: number;

	beforeEach(async () => {
		handle = await createTestDatabase();
		await importReference(handle.db, referenceFixture);
		concertoId = await workId(handle, 9001);
	});

	afterEach(async () => {
		await handle.close();
	});

	it('crée une écoute avec une nouvelle version et ses moments', async () => {
		const result = await createListen(handle.db, {
			workId: concertoId,
			recording: { kind: 'new', performers: 'Rostropovitch, Karajan', year: 1968 },
			listenedOn: '2026-11-03',
			rating: 9,
			movementRatings: [9, 10, 8],
			notes: 'Autorité incroyable.',
			moments: [
				{ movement: 1, atSeconds: 222, note: 'Le cor' },
				{ movement: 2, atSeconds: 430, note: 'Les bois' }
			]
		});
		expect(result.ok).toBe(true);

		const detail = await getWorkDetail(handle.db, concertoId, null);
		expect(detail?.recordings).toHaveLength(1);
		expect(detail?.recordings[0]?.summary).toMatchObject({ listenCount: 1, latestRating: 9 });
		expect(detail?.entries[0]?.moments.map((moment) => moment.note)).toEqual([
			'Le cor',
			'Les bois'
		]);
	});

	it('refuse une version qui n’appartient pas à l’œuvre', async () => {
		const otherWork = await workId(handle, 9002);
		const recordingId = await addRecording(handle.db, otherWork, {
			performers: 'Kertész',
			year: 1966
		});
		const result = await createListen(handle.db, {
			workId: concertoId,
			recording: { kind: 'existing', id: recordingId },
			listenedOn: '2026-11-03',
			rating: 7,
			movementRatings: [],
			notes: null,
			moments: []
		});
		expect(result).toEqual({ ok: false, reason: 'unknown-recording' });
	});

	it('garde une seule version de référence par œuvre', async () => {
		const first = await addRecording(handle.db, concertoId, { performers: 'A', year: null });
		const second = await addRecording(handle.db, concertoId, { performers: 'B', year: null });
		await setReference(handle.db, concertoId, first);
		await setReference(handle.db, concertoId, second);
		const detail = await getWorkDetail(handle.db, concertoId, null);
		expect(
			detail?.recordings.filter((recording) => recording.isReference).map((r) => r.id)
		).toEqual([second]);

		await setReference(handle.db, concertoId, second);
		const cleared = await getWorkDetail(handle.db, concertoId, null);
		expect(cleared?.recordings.some((recording) => recording.isReference)).toBe(false);
	});

	it('alimente la frise, la fiche compositeur et le journal', async () => {
		await createListen(handle.db, {
			workId: concertoId,
			recording: { kind: 'new', performers: 'Du Pré, Barenboim', year: 1970 },
			listenedOn: '2026-10-12',
			rating: 8,
			movementRatings: [],
			notes: null,
			moments: []
		});

		const timeline = await listTimelineComposers(handle.db);
		expect(timeline.map((composer) => [composer.name, composer.listened])).toEqual(
			expect.arrayContaining([
				['Brahms', false],
				['Dvořák', true]
			])
		);
		expect(timeline.some((composer) => composer.name === 'Suk')).toBe(false);

		const [dvorakId] = timeline.filter((c) => c.name === 'Dvořák').map((c) => c.id);
		const detail = await getComposerDetail(handle.db, dvorakId ?? 0);
		expect(detail?.coverage).toEqual({ listened: 1, total: 2, ratio: 0.5 });
		expect(detail?.circle.map((member) => [member.name, member.relation])).toEqual([
			['Dvořák', 'Lui-même'],
			['Brahms', 'Une influence'],
			['Suk', 'Son élève']
		]);
		expect(detail?.works[0]).toMatchObject({ rating: 8, listenCount: 1 });

		const others = await searchComposerWorks(handle.db, dvorakId ?? 0, '');
		expect(others.map((work) => work.title)).toEqual([
			'Piano Trio no. 4 in E minor, op. 90, "Dumky"'
		]);

		const recent = await listRecentListens(handle.db);
		expect(recent[0]).toMatchObject({ composerName: 'Dvořák', rating: 8 });
		const journal = await listJournal(handle.db, 5);
		expect(journal).toMatchObject({ total: 1, page: 1, pageCount: 1 });
	});

	it('cherche les œuvres sans tenir compte des accents', async () => {
		const results = await searchWorks(handle.db, 'dvorak concerto');
		expect(results.map((result) => result.title)).toEqual([
			'Concerto pour violoncelle en si mineur, op. 104'
		]);
	});

	it('gère la file d’écoute', async () => {
		await setWatchlisted(handle.db, concertoId, true);
		await setWatchlisted(handle.db, concertoId, true);
		expect(await listWatchlist(handle.db)).toHaveLength(1);
		await setWatchlisted(handle.db, concertoId, false);
		expect(await listWatchlist(handle.db)).toHaveLength(0);
	});
});
