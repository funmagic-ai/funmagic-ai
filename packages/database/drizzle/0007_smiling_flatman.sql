ALTER TABLE "credit_packages" ADD COLUMN "translations" jsonb DEFAULT '{"en":{"name":"","description":""}}'::jsonb NOT NULL;

-- Data migration: copy existing name/description to translations.en
UPDATE credit_packages SET translations = jsonb_build_object('en', jsonb_build_object('name', name, 'description', COALESCE(description, '')));