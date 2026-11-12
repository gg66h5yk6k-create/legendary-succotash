CREATE TABLE "resumes" (
	"user_id" text PRIMARY KEY,
	"document" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
