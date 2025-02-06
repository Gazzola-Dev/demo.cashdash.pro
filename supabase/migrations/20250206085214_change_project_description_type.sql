-- Add temporary column for the new text description
ALTER TABLE projects 
ADD COLUMN description_text TEXT;

-- Convert existing JSONB descriptions to text
-- This handles the nested JSONB structure we can see was being used
UPDATE projects 
SET description_text = COALESCE(
    (description->'content'->0->'content'->0->>'text')::text,
    'No description provided'
)
WHERE description IS NOT NULL;

-- Fill NULL descriptions with default text
UPDATE projects 
SET description_text = 'No description provided'
WHERE description_text IS NULL;

-- Drop the old description column
ALTER TABLE projects DROP COLUMN description;

-- Rename the new column to description
ALTER TABLE projects RENAME COLUMN description_text TO description;

-- Add comment to explain the change
COMMENT ON COLUMN projects.description IS 'Project description in plain text format';