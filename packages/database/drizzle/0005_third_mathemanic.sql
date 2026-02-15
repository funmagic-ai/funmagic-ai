CREATE TABLE "rate_limit_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tiers" jsonb NOT NULL,
	"limits" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
