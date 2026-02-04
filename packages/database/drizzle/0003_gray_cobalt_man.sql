ALTER TABLE "providers" ADD COLUMN "app_id" text;--> statement-breakpoint
ALTER TABLE "providers" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "tool_types" DROP COLUMN "icon";--> statement-breakpoint
ALTER TABLE "tool_types" DROP COLUMN "color";--> statement-breakpoint
ALTER TABLE "tool_types" DROP COLUMN "sort_order";