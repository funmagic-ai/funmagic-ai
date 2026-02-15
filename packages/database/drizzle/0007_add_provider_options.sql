-- Add provider_options column to studio_generations for storing provider-specific options per generation
ALTER TABLE "studio_generations" ADD COLUMN "provider_options" jsonb;
