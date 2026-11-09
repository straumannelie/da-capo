CREATE TABLE "concerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"venue" text NOT NULL,
	"title" text,
	"performers" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recordings" ADD COLUMN "concert_id" integer;--> statement-breakpoint
CREATE INDEX "concerts_date_idx" ON "concerts" USING btree ("date");--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_concert_id_concerts_id_fk" FOREIGN KEY ("concert_id") REFERENCES "public"."concerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recordings_concert_idx" ON "recordings" USING btree ("concert_id");