import { sql } from 'drizzle-orm';
import {
	boolean,
	check,
	date,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	serial,
	smallint,
	text,
	timestamp,
	uniqueIndex
} from 'drizzle-orm/pg-core';

export const relationType = pgEnum('relation_type', ['eleve_de', 'influence_par']);

export const composers = pgTable(
	'composers',
	{
		id: serial('id').primaryKey(),
		openOpusId: integer('open_opus_id').notNull().unique(),
		name: text('name').notNull(),
		completeName: text('complete_name').notNull(),
		birthYear: smallint('birth_year'),
		deathYear: smallint('death_year'),
		epoch: text('epoch').notNull(),
		wikidataId: text('wikidata_id'),
		birthPlace: text('birth_place'),
		deathPlace: text('death_place'),
		bio: text('bio'),
		bioUrl: text('bio_url'),
		popular: boolean('popular').notNull().default(false),
		recommended: boolean('recommended').notNull().default(false),
		followed: boolean('followed').notNull().default(false)
	},
	(table) => [index('composers_birth_year_idx').on(table.birthYear)]
);

export const composerRelations = pgTable(
	'composer_relations',
	{
		fromId: integer('from_id')
			.notNull()
			.references(() => composers.id, { onDelete: 'cascade' }),
		toId: integer('to_id')
			.notNull()
			.references(() => composers.id, { onDelete: 'cascade' }),
		type: relationType('type').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.fromId, table.toId, table.type] }),
		index('composer_relations_to_idx').on(table.toId),
		check('composer_relations_distinct', sql`${table.fromId} <> ${table.toId}`)
	]
);

export const works = pgTable(
	'works',
	{
		id: serial('id').primaryKey(),
		openOpusId: integer('open_opus_id').unique(),
		composerId: integer('composer_id')
			.notNull()
			.references(() => composers.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		titleFr: text('title_fr'),
		subtitle: text('subtitle'),
		genre: text('genre'),
		popular: boolean('popular').notNull().default(false),
		recommended: boolean('recommended').notNull().default(false),
		movements: text('movements')
			.array()
			.notNull()
			.default(sql`'{}'::text[]`),
		searchText: text('search_text').notNull().default('')
	},
	(table) => [index('works_composer_idx').on(table.composerId)]
);

export const concerts = pgTable(
	'concerts',
	{
		id: serial('id').primaryKey(),
		date: date('date', { mode: 'string' }).notNull(),
		venue: text('venue').notNull(),
		title: text('title'),
		performers: text('performers').notNull(),
		notes: text('notes'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [index('concerts_date_idx').on(table.date)]
);

export const recordings = pgTable(
	'recordings',
	{
		id: serial('id').primaryKey(),
		workId: integer('work_id')
			.notNull()
			.references(() => works.id, { onDelete: 'cascade' }),
		performers: text('performers').notNull(),
		year: smallint('year'),
		isReference: boolean('is_reference').notNull().default(false),
		concertId: integer('concert_id').references(() => concerts.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('recordings_work_idx').on(table.workId),
		index('recordings_concert_idx').on(table.concertId),
		uniqueIndex('recordings_one_reference_idx')
			.on(table.workId)
			.where(sql`${table.isReference}`)
	]
);

export const listens = pgTable(
	'listens',
	{
		id: serial('id').primaryKey(),
		recordingId: integer('recording_id')
			.notNull()
			.references(() => recordings.id, { onDelete: 'cascade' }),
		listenedOn: date('listened_on', { mode: 'string' }).notNull(),
		rating: smallint('rating').notNull(),
		movementRatings: jsonb('movement_ratings').$type<(number | null)[]>().notNull().default([]),
		notes: text('notes'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('listens_recording_idx').on(table.recordingId),
		index('listens_listened_on_idx').on(table.listenedOn),
		check('listens_rating_range', sql`${table.rating} between 1 and 10`)
	]
);

export const moments = pgTable(
	'moments',
	{
		id: serial('id').primaryKey(),
		listenId: integer('listen_id')
			.notNull()
			.references(() => listens.id, { onDelete: 'cascade' }),
		position: smallint('position').notNull(),
		movement: smallint('movement'),
		atSeconds: integer('at_seconds'),
		note: text('note').notNull()
	},
	(table) => [index('moments_listen_idx').on(table.listenId)]
);

export const watchlist = pgTable('watchlist', {
	workId: integer('work_id')
		.primaryKey()
		.references(() => works.id, { onDelete: 'cascade' }),
	addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow()
});
