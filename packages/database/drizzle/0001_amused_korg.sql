ALTER TABLE "tools" ALTER COLUMN "translations" SET DEFAULT '{"en":{"title":"","description":""}}'::jsonb;--> statement-breakpoint
ALTER TABLE "tools" DROP COLUMN "short_description";