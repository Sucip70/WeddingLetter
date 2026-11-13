-- Amplop, Bunga Bermekaran, and Ombak are no longer supported gate kinds.
-- Move existing templates to the retained letter gate. Seasonal templates
-- still render their design-specific artwork gate in the web application.
UPDATE "templates"
SET "layoutSchema" = jsonb_set("layoutSchema", '{theme,gate}', '"sakura"'::jsonb, true)
WHERE "layoutSchema" #>> '{theme,gate}' IN ('envelope', 'bloom', 'waves');
