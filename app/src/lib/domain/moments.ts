export interface Moment {
	readonly movement: number | null;
	readonly atSeconds: number | null;
	readonly note: string;
}

const ROMAN_VALUES: Readonly<Record<string, number>> = { I: 1, V: 5, X: 10 };

const LINE_PATTERN =
	/^(?:(?<movement>[IVX]{1,5}|\d{1,2})(?:[.,]\s*|\s+(?=\d{1,2}:\d{2})))?(?:(?<time>\d{1,2}(?::\d{2}){1,2})(?:\s*[-–—:]\s*|\s+|$))?(?<note>.*)$/u;

export function romanToInt(value: string): number | null {
	if (!/^[IVX]+$/.test(value)) {
		return null;
	}
	let total = 0;
	for (let index = 0; index < value.length; index += 1) {
		const current = ROMAN_VALUES[value.charAt(index)] ?? 0;
		const next = ROMAN_VALUES[value.charAt(index + 1)] ?? 0;
		total += current < next ? -current : current;
	}
	return toRoman(total) === value ? total : null;
}

export function toRoman(value: number): string {
	if (!Number.isInteger(value) || value < 1 || value > 39) {
		return String(value);
	}
	const tens = 'X'.repeat(Math.floor(value / 10));
	const units = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][value % 10] ?? '';
	return tens + units;
}

export function parseTimestamp(value: string): number | null {
	const parts = value.split(':').map(Number);
	if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isInteger(part))) {
		return null;
	}
	const [first = 0, second = 0, third] = parts;
	if (third === undefined) {
		return second < 60 ? first * 60 + second : null;
	}
	return second < 60 && third < 60 ? first * 3600 + second * 60 + third : null;
}

export function formatTimestamp(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const rest = String(seconds % 60).padStart(2, '0');
	return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}

function parseMovement(value: string | undefined): number | null {
	if (value === undefined) {
		return null;
	}
	const arabic = Number(value);
	if (Number.isInteger(arabic)) {
		return arabic > 0 ? arabic : null;
	}
	return romanToInt(value);
}

export function parseMomentLine(line: string): Moment | null {
	const trimmed = line.trim();
	if (trimmed === '') {
		return null;
	}
	const groups = LINE_PATTERN.exec(trimmed)?.groups ?? {};
	const movement = parseMovement(groups['movement']);
	const time = groups['time'];
	const note = (groups['note'] ?? '').trim();
	const atSeconds = time === undefined ? null : parseTimestamp(time);

	if (time !== undefined && atSeconds === null) {
		return { movement, atSeconds: null, note: `${time} ${note}`.trim() };
	}
	if (movement === null && groups['movement'] !== undefined) {
		return { movement: null, atSeconds: null, note: trimmed };
	}
	return { movement, atSeconds, note };
}

export function parseMoments(text: string): Moment[] {
	return text
		.split(/\r?\n/u)
		.map(parseMomentLine)
		.filter((moment): moment is Moment => moment !== null);
}

export function momentLabel(moment: Pick<Moment, 'movement' | 'atSeconds'>): string {
	const parts = [
		moment.movement === null ? null : toRoman(moment.movement),
		moment.atSeconds === null ? null : formatTimestamp(moment.atSeconds)
	].filter((part): part is string => part !== null);
	return parts.join(', ');
}
