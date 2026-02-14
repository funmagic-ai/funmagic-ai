ALTER TABLE "tool_types" RENAME COLUMN "display_name" TO "title";--> statement-breakpoint
ALTER TABLE "tool_types" ALTER COLUMN "translations" SET DEFAULT '{"en":{"title":"","description":""}}'::jsonb;
