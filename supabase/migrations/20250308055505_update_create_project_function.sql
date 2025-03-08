-- Improved create_project_with_owner function
CREATE OR REPLACE FUNCTION public.create_project_with_owner(
    p_name text,
    p_description text,
    p_prefix text,
    p_slug text,
    p_owner_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_project projects;
    final_slug text;
    unique_slug text;
    counter integer := 1;
    existing_slug_count integer;
BEGIN
    -- Generate a base slug from the provided slug if it's not empty,
    -- otherwise use the project name
    IF p_slug IS NOT NULL AND p_slug <> '' THEN
        final_slug := to_kebab_case(p_slug);
    ELSE
        final_slug := to_kebab_case(p_name);
    END IF;

    -- Ensure the slug is unique by appending a number if needed
    unique_slug := final_slug;
    
    -- Keep checking for uniqueness until we find one
    LOOP
        SELECT COUNT(*) INTO existing_slug_count
        FROM projects
        WHERE slug = unique_slug;
        
        IF existing_slug_count = 0 THEN
            -- Unique slug found
            EXIT;
        END IF;
        
        -- Append incremented counter to the base slug
        unique_slug := final_slug || '-' || counter::text;
        counter := counter + 1;
    END LOOP;

    -- Create the project with the unique slug
    INSERT INTO projects (
        name,
        description,
        prefix,
        slug,
        status
    ) VALUES (
        p_name,
        p_description,
        p_prefix,
        unique_slug,
        'active'
    )
    RETURNING * INTO new_project;

    -- Create the owner project_member record
    INSERT INTO project_members (
        project_id,
        user_id,
        role
    ) VALUES (
        new_project.id,
        p_owner_id,
        'owner'
    );

    -- Return the new project as JSON
    RETURN json_build_object(
        'id', new_project.id,
        'name', new_project.name,
        'description', new_project.description,
        'prefix', new_project.prefix,
        'slug', new_project.slug,
        'status', new_project.status,
        'created_at', new_project.created_at,
        'updated_at', new_project.updated_at
    );
END;
$$;