-- Data-only clean-up for press targets saved before targets could have no date or type.
-- A Draft submission is a target that hasn't been pitched, so it has no real submission date.
UPDATE "PressSubmission"
SET "dateSubmitted" = NULL
WHERE "status" = 'Draft';

-- Targets used to be saved as type "Other" with no description when no type was chosen.
-- A real "Other" always had a description, so only the automatic fallback is cleared.
UPDATE "PressSubmission"
SET "articleType" = NULL
WHERE "status" = 'Draft'
  AND "articleType" = 'Other'
  AND ("articleTypeOther" IS NULL OR btrim("articleTypeOther") = '');
