import { z } from 'zod';
import { parseMoments, type Moment } from './moments.ts';

export type ParseResult<T> =
	| { readonly ok: true; readonly value: T }
	| { readonly ok: false; readonly errors: Readonly<Record<string, string>> };

export type RecordingChoice =
	| { readonly kind: 'existing'; readonly id: number }
	| { readonly kind: 'new'; readonly performers: string; readonly year: number | null };

export interface ListenInput {
	readonly workId: number;
	readonly recording: RecordingChoice;
	readonly listenedOn: string;
	readonly rating: number;
	readonly movementRatings: readonly (number | null)[];
	readonly notes: string | null;
	readonly moments: readonly Moment[];
}

export interface RecordingInput {
	readonly performers: string;
	readonly year: number | null;
}

export interface ConcertInput {
	readonly date: string;
	readonly venue: string;
	readonly title: string | null;
	readonly performers: string;
	readonly notes: string | null;
}

export interface ProgramItemInput {
	readonly workId: number;
	readonly performers: string | null;
}

const MESSAGES = {
	workId: 'Choisis une œuvre.',
	recording: 'Choisis une version ou ajoute-en une.',
	performers: 'Indique les interprètes de cette version.',
	year: 'L’année doit être un nombre entre 1877 et l’année en cours.',
	listenedOn: 'Indique une date valide.',
	rating: 'Choisis une note entre 1 et 10.',
	movementRatings: 'Les notes par mouvement vont de 1 à 10.',
	notes: 'Le texte est limité à 5 000 caractères.',
	moments: 'Les moments sont limités à 5 000 caractères.',
	movements: 'Une œuvre compte au plus 40 mouvements de 120 caractères.',
	date: 'Indique la date du concert.',
	venue: 'Indique la salle.',
	title: 'Le titre est limité à 200 caractères.'
} as const;

const MAX_MOVEMENTS = 40;

const optionalYear = (currentYear: number) =>
	z
		.string()
		.trim()
		.transform((value, context) => {
			if (value === '') {
				return null;
			}
			const year = Number(value);
			if (!Number.isInteger(year) || year < 1877 || year > currentYear) {
				context.addIssue({ code: 'custom', message: MESSAGES.year });
				return z.NEVER;
			}
			return year;
		});

const listenSchema = (currentYear: number) =>
	z.object({
		workId: z.coerce.number().int().positive(),
		recording: z.union([z.literal('new'), z.coerce.number().int().positive()]),
		performers: z.string().trim().max(300),
		year: optionalYear(currentYear),
		listenedOn: z.iso.date(),
		rating: z.coerce.number().int().min(1).max(10),
		notes: z.string().trim().max(5000),
		moments: z.string().max(5000)
	});

const recordingSchema = (currentYear: number) =>
	z.object({
		performers: z.string().trim().min(1).max(300),
		year: optionalYear(currentYear)
	});

const concertSchema = z.object({
	date: z.iso.date(),
	venue: z.string().trim().min(1).max(200),
	title: z.string().trim().max(200),
	performers: z.string().trim().min(1).max(300),
	notes: z.string().trim().max(5000)
});

const programItemSchema = z.object({
	workId: z.coerce.number().int().positive(),
	performers: z.string().trim().max(300)
});

function text(form: FormData, name: string): string {
	const value = form.get(name);
	return typeof value === 'string' ? value : '';
}

function collectErrors(issues: readonly z.core.$ZodIssue[]): Record<string, string> {
	const errors: Record<string, string> = {};
	for (const issue of issues) {
		const field = String(issue.path[0] ?? 'form');
		errors[field] ??= field in MESSAGES ? MESSAGES[field as keyof typeof MESSAGES] : issue.message;
	}
	return errors;
}

export function parseMovementRatings(
	values: readonly FormDataEntryValue[],
	movementCount: number
): ParseResult<(number | null)[]> {
	const ratings: (number | null)[] = [];
	for (const value of values.slice(0, movementCount)) {
		const raw = typeof value === 'string' ? value.trim() : '';
		if (raw === '') {
			ratings.push(null);
			continue;
		}
		const rating = Number(raw);
		if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
			return { ok: false, errors: { movementRatings: MESSAGES.movementRatings } };
		}
		ratings.push(rating);
	}
	return { ok: true, value: ratings.some((rating) => rating !== null) ? ratings : [] };
}

export function parseListenForm(
	form: FormData,
	movementCount: number,
	currentYear: number
): ParseResult<ListenInput> {
	const parsed = listenSchema(currentYear).safeParse({
		workId: text(form, 'workId'),
		recording: text(form, 'recording'),
		performers: text(form, 'performers'),
		year: text(form, 'year'),
		listenedOn: text(form, 'listenedOn'),
		rating: text(form, 'rating'),
		notes: text(form, 'notes'),
		moments: text(form, 'moments')
	});
	const movementRatings = parseMovementRatings(form.getAll('movementRating'), movementCount);
	const missingPerformers =
		text(form, 'recording') === 'new' && text(form, 'performers').trim() === '';

	if (!parsed.success || !movementRatings.ok || missingPerformers) {
		return {
			ok: false,
			errors: {
				...(parsed.success ? {} : collectErrors(parsed.error.issues)),
				...(movementRatings.ok ? {} : movementRatings.errors),
				...(missingPerformers ? { performers: MESSAGES.performers } : {})
			}
		};
	}

	const { data } = parsed;
	const recording: RecordingChoice =
		data.recording === 'new'
			? { kind: 'new', performers: data.performers, year: data.year }
			: { kind: 'existing', id: data.recording };

	return {
		ok: true,
		value: {
			workId: data.workId,
			recording,
			listenedOn: data.listenedOn,
			rating: data.rating,
			movementRatings: movementRatings.value,
			notes: data.notes === '' ? null : data.notes,
			moments: parseMoments(data.moments)
		}
	};
}

export function parseRecordingForm(
	form: FormData,
	currentYear: number
): ParseResult<RecordingInput> {
	const parsed = recordingSchema(currentYear).safeParse({
		performers: text(form, 'performers'),
		year: text(form, 'year')
	});
	return parsed.success
		? { ok: true, value: parsed.data }
		: { ok: false, errors: collectErrors(parsed.error.issues) };
}

export function parseMovementsForm(form: FormData): ParseResult<string[]> {
	const movements = text(form, 'movements')
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.filter((line) => line !== '');
	if (movements.length > MAX_MOVEMENTS || movements.some((line) => line.length > 120)) {
		return { ok: false, errors: { movements: MESSAGES.movements } };
	}
	return { ok: true, value: movements };
}

function emptyToNull(value: string): string | null {
	return value === '' ? null : value;
}

export function parseConcertForm(form: FormData): ParseResult<ConcertInput> {
	const parsed = concertSchema.safeParse({
		date: text(form, 'date'),
		venue: text(form, 'venue'),
		title: text(form, 'title'),
		performers: text(form, 'performers'),
		notes: text(form, 'notes')
	});
	if (!parsed.success) {
		const errors = collectErrors(parsed.error.issues);
		return {
			ok: false,
			errors:
				errors['performers'] === undefined
					? errors
					: { ...errors, performers: 'Indique les interprètes du concert.' }
		};
	}
	return {
		ok: true,
		value: {
			...parsed.data,
			title: emptyToNull(parsed.data.title),
			notes: emptyToNull(parsed.data.notes)
		}
	};
}

export function parseProgramItemForm(form: FormData): ParseResult<ProgramItemInput> {
	const parsed = programItemSchema.safeParse({
		workId: text(form, 'workId'),
		performers: text(form, 'performers')
	});
	if (!parsed.success) {
		return { ok: false, errors: collectErrors(parsed.error.issues) };
	}
	return {
		ok: true,
		value: { workId: parsed.data.workId, performers: emptyToNull(parsed.data.performers) }
	};
}
