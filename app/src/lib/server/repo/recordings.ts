import { and, eq } from 'drizzle-orm';
import type { RecordingInput } from '#lib/domain/forms.ts';
import type { Database } from '../db/client.ts';
import { recordings } from '../db/schema.ts';

export async function addRecording(
	db: Database,
	workId: number,
	input: RecordingInput
): Promise<number> {
	const [row] = await db
		.insert(recordings)
		.values({ workId, performers: input.performers, year: input.year })
		.returning({ id: recordings.id });
	if (!row) {
		throw new Error('La version n’a pas été enregistrée.');
	}
	return row.id;
}

export async function setReference(
	db: Database,
	workId: number,
	recordingId: number
): Promise<boolean> {
	return db.transaction(async (tx) => {
		const [target] = await tx
			.select({ isReference: recordings.isReference })
			.from(recordings)
			.where(and(eq(recordings.id, recordingId), eq(recordings.workId, workId)))
			.limit(1);
		if (!target) {
			return false;
		}
		await tx
			.update(recordings)
			.set({ isReference: false })
			.where(and(eq(recordings.workId, workId), eq(recordings.isReference, true)));
		if (!target.isReference) {
			await tx.update(recordings).set({ isReference: true }).where(eq(recordings.id, recordingId));
		}
		return true;
	});
}
