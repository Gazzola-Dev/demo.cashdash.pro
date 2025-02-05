CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_slug text, table_name text, existing_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_slug text := base_slug;
    counter integer := 1;
    slug_exists boolean;
    is_reserved boolean;
BEGIN
    -- Define comprehensive list of reserved slugs based on static routes
    is_reserved := new_slug = ANY(ARRAY[
        -- Core app routes
        'settings',
        'projects',
        'support',
        'feedback',
        'privacy',
        'terms',
        '404',
        'about',
        'invite',
        
        -- Project sub-routes
        'kanban',
        'timeline',
        'tasks',
        'new',
        
        -- Settings sub-routes
        'billing',
        'profile',
        'team',
        'notifications',
        
        -- Additional static segments
        'auth',
        'admin',
        'api'
    ]);

    -- If slug is reserved, append a number immediately
    IF is_reserved THEN
        new_slug := base_slug || '-1';
        counter := 2;
    END IF;

    -- Keep checking until we find a unique slug
    LOOP
        -- Check if slug exists in the specified table
        EXECUTE format('
            SELECT EXISTS(
                SELECT 1 FROM %I 
                WHERE slug = $1
                AND ($2::uuid IS NULL OR id != $2)
            )', table_name)
        INTO slug_exists
        USING new_slug, existing_id;

        -- Exit loop if we found a unique slug
        EXIT WHEN NOT slug_exists;

        -- Append or increment counter
        new_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;

    RETURN new_slug;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.generate_unique_slug(text, text, uuid) TO authenticated;

-- Test function
DO $$
DECLARE
    test_slug text;
BEGIN
    -- Test reserved slug
    test_slug := public.generate_unique_slug('settings', 'projects');
    ASSERT test_slug = 'settings-1', 'Reserved slug test failed';
    
    -- Test normal slug
    test_slug := public.generate_unique_slug('test-project', 'projects');
    ASSERT test_slug = 'test-project', 'Normal slug test failed';
END $$;