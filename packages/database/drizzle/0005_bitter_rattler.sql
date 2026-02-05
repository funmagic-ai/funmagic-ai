ALTER TABLE "providers" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "tool_types" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "credit_packages" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "deleted_at" timestamp;