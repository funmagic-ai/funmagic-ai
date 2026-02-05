ALTER TABLE "tool_types" ADD COLUMN "translations" jsonb DEFAULT '{"en":{"displayName":"","description":""}}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tools" ADD COLUMN "translations" jsonb DEFAULT '{"en":{"title":"","description":"","shortDescription":""}}'::jsonb NOT NULL;--> statement-breakpoint

-- Migrate existing data to translations.en for tool_types
UPDATE "tool_types" SET "translations" = jsonb_build_object(
  'en', jsonb_build_object(
    'displayName', "display_name",
    'description', COALESCE("description", '')
  )
);--> statement-breakpoint

-- Migrate existing data to translations.en for tools
UPDATE "tools" SET "translations" = jsonb_build_object(
  'en', jsonb_build_object(
    'title', "title",
    'description', COALESCE("description", ''),
    'shortDescription', COALESCE("short_description", '')
  )
);