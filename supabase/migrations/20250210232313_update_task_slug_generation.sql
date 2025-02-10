-- First drop the triggers
DROP TRIGGER IF EXISTS before_task_update_trigger ON tasks;
DROP TRIGGER IF EXISTS before_project_update_trigger ON projects;

-- Then drop the functions
DROP FUNCTION IF EXISTS public.before_task_update();
DROP FUNCTION IF EXISTS public.before_project_update();

-- Create updated project trigger function (unchanged)
CREATE OR REPLACE FUNCTION before_project_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Generate slug if not provided and name has changed
    IF (NEW.slug IS NULL OR NEW.slug = '') OR 
       (NEW.name != OLD.name AND NEW.slug = OLD.slug) THEN
        NEW.slug := generate_unique_slug(
            to_kebab_case(NEW.name),
            'projects',
            NEW.id
        );
    END IF;

    -- Generate prefix if not provided
    IF NEW.prefix IS NULL OR NEW.prefix = '' THEN
        NEW.prefix := upper(substring(NEW.slug from 1 for 3));
    END IF;

    RETURN NEW;
END;
$$;

-- Create updated task trigger function with new slug format
CREATE OR REPLACE FUNCTION before_task_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    project_prefix text;
BEGIN
    -- Get project prefix
    SELECT prefix INTO project_prefix
    FROM projects
    WHERE id = NEW.project_id;

    -- Generate task prefix if not provided
    IF NEW.prefix IS NULL OR NEW.prefix = '' THEN
        NEW.prefix := project_prefix;
    END IF;

    -- Generate slug as prefix + ordinal_id
    IF (NEW.slug IS NULL OR NEW.slug = '') OR 
       (NEW.title != OLD.title AND NEW.slug = OLD.slug) OR
       (NEW.ordinal_id != OLD.ordinal_id AND NEW.slug = OLD.slug) THEN
        NEW.slug := NEW.prefix || NEW.ordinal_id::text;
    END IF;

    RETURN NEW;
END;
$$;

-- Recreate the triggers
CREATE TRIGGER before_project_update_trigger
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION before_project_update();

CREATE TRIGGER before_task_update_trigger
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION before_task_update();

-- Update existing task slugs to match new format
UPDATE tasks t
SET slug = (
    SELECT p.prefix || t.ordinal_id::text
    FROM projects p
    WHERE p.id = t.project_id
)
WHERE true;

-- Add comment explaining the slug format
COMMENT ON COLUMN tasks.slug IS 'Task slug in format: ProjectPrefix + TaskOrdinalID (e.g., MED123)';