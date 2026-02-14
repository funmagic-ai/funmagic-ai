ALTER TABLE "tool_types" DROP CONSTRAINT IF EXISTS "tool_types_name_unique";--> statement-breakpoint
ALTER TABLE "tools" DROP CONSTRAINT IF EXISTS "tools_slug_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "tool_types_name_unique_active" ON "tool_types" USING btree ("name") WHERE "tool_types"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tools_slug_unique_active" ON "tools" USING btree ("slug") WHERE "tools"."deleted_at" IS NULL;
