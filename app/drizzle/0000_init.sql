CREATE TYPE "public"."relation_type" AS ENUM('eleve_de', 'influence_par');--> statement-breakpoint
CREATE TABLE "composer_relations" (
	"from_id" integer NOT NULL,
	"to_id" integer NOT NULL,
	"type" "relation_type" NOT NULL,
	CONSTRAINT "composer_relations_from_id_to_id_type_pk" PRIMARY KEY("from_id","to_id","type"),
	CONSTRAINT "composer_relations_distinct" CHECK ("composer_relations"."from_id" <> "composer_relations"."to_id")
);
--> statement-breakpoint
CREATE TABLE "composers" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_opus_id" integer NOT NULL,
	"name" text NOT NULL,
	"complete_name" text NOT NULL,
	"birth_year" smallint,
	"death_year" smallint,
	"epoch" text NOT NULL,
	"wikidata_id" text,
	"birth_place" text,
	"death_place" text,
	"bio" text,
	"bio_url" text,
	"popular" boolean DEFAULT false NOT NULL,
	"recommended" boolean DEFAULT false NOT NULL,
	"followed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "composers_open_opus_id_unique" UNIQUE("open_opus_id")
);
--> statement-breakpoint
CREATE TABLE "listens" (
	"id" serial PRIMARY KEY NOT NULL,
	"recording_id" integer NOT NULL,
	"listened_on" date NOT NULL,
	"rating" smallint NOT NULL,
	"movement_ratings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listens_rating_range" CHECK ("listens"."rating" between 1 and 10)
);
--> statement-breakpoint
CREATE TABLE "moments" (
	"id" serial PRIMARY KEY NOT NULL,
	"listen_id" integer NOT NULL,
	"position" smallint NOT NULL,
	"movement" smallint,
	"at_seconds" integer,
	"note" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recordings" (
	"id" serial PRIMARY KEY NOT NULL,
	"work_id" integer NOT NULL,
	"performers" text NOT NULL,
	"year" smallint,
	"is_reference" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlist" (
	"work_id" integer PRIMARY KEY NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "works" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_opus_id" integer,
	"composer_id" integer NOT NULL,
	"title" text NOT NULL,
	"title_fr" text,
	"subtitle" text,
	"genre" text,
	"popular" boolean DEFAULT false NOT NULL,
	"recommended" boolean DEFAULT false NOT NULL,
	"movements" text[] DEFAULT '{}'::text[] NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	CONSTRAINT "works_open_opus_id_unique" UNIQUE("open_opus_id")
);
--> statement-breakpoint
ALTER TABLE "composer_relations" ADD CONSTRAINT "composer_relations_from_id_composers_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."composers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "composer_relations" ADD CONSTRAINT "composer_relations_to_id_composers_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."composers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listens" ADD CONSTRAINT "listens_recording_id_recordings_id_fk" FOREIGN KEY ("recording_id") REFERENCES "public"."recordings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moments" ADD CONSTRAINT "moments_listen_id_listens_id_fk" FOREIGN KEY ("listen_id") REFERENCES "public"."listens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_composer_id_composers_id_fk" FOREIGN KEY ("composer_id") REFERENCES "public"."composers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "composer_relations_to_idx" ON "composer_relations" USING btree ("to_id");--> statement-breakpoint
CREATE INDEX "composers_birth_year_idx" ON "composers" USING btree ("birth_year");--> statement-breakpoint
CREATE INDEX "listens_recording_idx" ON "listens" USING btree ("recording_id");--> statement-breakpoint
CREATE INDEX "listens_listened_on_idx" ON "listens" USING btree ("listened_on");--> statement-breakpoint
CREATE INDEX "moments_listen_idx" ON "moments" USING btree ("listen_id");--> statement-breakpoint
CREATE INDEX "recordings_work_idx" ON "recordings" USING btree ("work_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recordings_one_reference_idx" ON "recordings" USING btree ("work_id") WHERE "recordings"."is_reference";--> statement-breakpoint
CREATE INDEX "works_composer_idx" ON "works" USING btree ("composer_id");