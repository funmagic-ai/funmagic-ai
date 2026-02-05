ALTER TABLE "banners" ALTER COLUMN "link_text" SET DEFAULT 'Learn More';--> statement-breakpoint
ALTER TABLE "banners" ALTER COLUMN "link_text" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "banners" ALTER COLUMN "link_target" SET NOT NULL;