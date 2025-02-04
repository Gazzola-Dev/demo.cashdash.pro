-- Create a function to generate a unique slug
CREATE OR REPLACE FUNCTION generate_unique_slug(base_slug text, table_name text, existing_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_slug text := base_slug;
    counter integer := 1;
    slug_exists boolean;
BEGIN
    -- Ensure base_slug is not longer than 50 characters
    new_slug := substring(base_slug from 1 for 50);
    
    LOOP
        IF table_name = 'projects' THEN
            IF existing_id IS NOT NULL THEN
                SELECT EXISTS (
                    SELECT 1 FROM projects 
                    WHERE slug = new_slug AND id != existing_id
                ) INTO slug_exists;
            ELSE
                SELECT EXISTS (
                    SELECT 1 FROM projects WHERE slug = new_slug
                ) INTO slug_exists;
            END IF;
        ELSE
            IF existing_id IS NOT NULL THEN
                SELECT EXISTS (
                    SELECT 1 FROM tasks 
                    WHERE slug = new_slug AND id != existing_id
                ) INTO slug_exists;
            ELSE
                SELECT EXISTS (
                    SELECT 1 FROM tasks WHERE slug = new_slug
                ) INTO slug_exists;
            END IF;
        END IF;

        IF NOT slug_exists THEN
            RETURN new_slug;
        END IF;

        counter := counter + 1;
        new_slug := substring(base_slug from 1 for 47) || '-' || counter;
    END LOOP;
END;
$$;

-- Create function to convert text to kebab case
CREATE OR REPLACE FUNCTION to_kebab_case(text_input text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN lower(regexp_replace(
        regexp_replace(
            regexp_replace(text_input, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
    ));
END;
$$;

-- Create trigger function for projects
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

-- Create trigger function for tasks
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
        NEW.prefix := project_prefix || '-' || NEW.ordinal_id::text;
    END IF;

    -- Generate slug if not provided and title has changed
    IF (NEW.slug IS NULL OR NEW.slug = '') OR 
       (NEW.title != OLD.title AND NEW.slug = OLD.slug) THEN
        NEW.slug := generate_unique_slug(
            to_kebab_case(NEW.title),
            'tasks',
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Create the triggers
DROP TRIGGER IF EXISTS before_project_update_trigger ON projects;
CREATE TRIGGER before_project_update_trigger
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION before_project_update();

DROP TRIGGER IF EXISTS before_task_update_trigger ON tasks;
CREATE TRIGGER before_task_update_trigger
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION before_task_update();