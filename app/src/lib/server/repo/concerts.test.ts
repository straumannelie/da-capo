import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseHandle } from '../db/client.ts';
import { listens, works } from '../db/schema.ts';
import { importReference } from '../reference.ts';
import { createTestDatabase } from '../testing/database.ts';
import { referenceFixture } from '../testing/fixtures.ts';
import {
	addProgramItem,
	createConcert,
	deleteConcert,
	getConcert,
	listConcerts,
	removeProgramItem
} from './concerts.ts';
import { createListen, listRecentListens } from './listens.ts';
import { listListenFacts } from './statistics.ts';
import { getWorkDetail } from './works.ts';

describe('concerts', () => {
	let handle: DatabaseHandle;
	let concertoId: number;
	let symphonyId: number;

	beforeEach(async () => {
		handle = await createTestDatabase();
		await importReference(handle.db, referenceFixture);
		const rows = await handle.db.select({ id: works.id, openOpusId: works.openOpusId }).from(works);
		concertoId = rows.find((row) => row.openOpusId === 9001)?.id ?? 0;
		symphonyId = rows.find((row) => row.openOpusId === 9002)?.id ?? 0;
	});

	afterEach(async () => {
		await handle.close();
	});

	async function concertWithProgram(date: string) {
		const concertId = await createConcert(handle.db, {
			date,
			venue: 'Grand Auditório',
			title: 'Dvořák en miroir',
			performers: 'Orchestre Gulbenkian, Lorenzo Viotti',
			notes: null
		});
		const concerto = await addProgramItem(handle.db, concertId, {
			workId: concertoId,
			performers: 'Sol Gabetta, Orchestre Gulbenkian, Lorenzo Viotti'
		});
		const symphony = await addProgramItem(handle.db, concertId, {
			workId: symphonyId,
			performers: null
		});
		return { concertId, concerto: concerto ?? 0, symphony: symphony ?? 0 };
	}

	it('construit le programme en créant une version par œuvre', async () => {
		const { concertId } = await concertWithProgram('2026-11-14');
		const concert = await getConcert(handle.db, concertId);
		expect(concert?.program.map((item) => [item.composerName, item.performers])).toEqual([
			['Dvořák', 'Sol Gabetta, Orchestre Gulbenkian, Lorenzo Viotti'],
			['Dvořák', 'Orchestre Gulbenkian, Lorenzo Viotti']
		]);

		const work = await getWorkDetail(handle.db, concertoId, null);
		expect(work?.recordings[0]).toMatchObject({
			year: 2026,
			concert: { id: concertId, date: '2026-11-14', venue: 'Grand Auditório' }
		});
	});

	it('sépare les concerts à venir des concerts passés', async () => {
		await concertWithProgram('2026-11-14');
		await concertWithProgram('2026-10-02');
		const { upcoming, past } = await listConcerts(handle.db, '2026-11-09');
		expect(upcoming.map((concert) => concert.date)).toEqual(['2026-11-14']);
		expect(past[0]).toMatchObject({ date: '2026-10-02', programSize: 2, ratedCount: 0 });
		expect(past[0]?.composers).toEqual(['Dvořák']);
	});

	it('compte une œuvre notée après le concert comme une écoute en concert', async () => {
		const { concertId, concerto } = await concertWithProgram('2026-10-02');
		await createListen(handle.db, {
			workId: concertoId,
			recording: { kind: 'existing', id: concerto },
			listenedOn: '2026-10-02',
			rating: 9,
			movementRatings: [],
			notes: 'Gabetta, un son immense.',
			moments: []
		});

		const { past } = await listConcerts(handle.db, '2026-11-09');
		expect(past[0]).toMatchObject({ id: concertId, ratedCount: 1 });
		const [recent] = await listRecentListens(handle.db, 1);
		expect(recent?.concertId).toBe(concertId);
		const facts = await listListenFacts(handle.db);
		expect(facts).toEqual([expect.objectContaining({ inConcert: true, rating: 9 })]);
	});

	it('retire une œuvre du programme et supprime un concert avec ses notes', async () => {
		const { concertId, concerto, symphony } = await concertWithProgram('2026-10-02');
		await createListen(handle.db, {
			workId: symphonyId,
			recording: { kind: 'existing', id: symphony },
			listenedOn: '2026-10-02',
			rating: 7,
			movementRatings: [],
			notes: null,
			moments: []
		});
		await removeProgramItem(handle.db, concertId, concerto);
		expect((await getConcert(handle.db, concertId))?.program).toHaveLength(1);

		await deleteConcert(handle.db, concertId);
		expect(await getConcert(handle.db, concertId)).toBeNull();
		expect(await handle.db.select().from(listens).where(eq(listens.recordingId, symphony))).toEqual(
			[]
		);
	});
});
