-- Drop the existing function first
DROP FUNCTION IF EXISTS public.create_project_with_owner;

-- Create updated function that returns full project details
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
    v_result json;
BEGIN
    -- Create the project
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
        p_slug,
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

    -- Get full project details including members, invitations and other relationships
    SELECT jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'description', p.description,
        'status', p.status,
        'slug', p.slug,
        'prefix', p.prefix,
        'github_repo_url', p.github_repo_url,
        'github_owner', p.github_owner,
        'github_repo', p.github_repo,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'project_members', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', pm.id,
                    'project_id', pm.project_id,
                    'user_id', pm.user_id,
                    'role', pm.role,
                    'created_at', pm.created_at,
                    'profile', prof_m
                )
            ) FILTER (WHERE pm.id IS NOT NULL),
            '[]'::jsonb
        ),
        'project_invitations', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', pi.id,
                    'project_id', pi.project_id,
                    'email', pi.email,
                    'role', pi.role,
                    'status', pi.status,
                    'created_at', pi.created_at,
                    'expires_at', pi.expires_at,
                    'inviter', prof_i
                )
            ) FILTER (WHERE pi.id IS NOT NULL),
            '[]'::jsonb
        ),
        'tasks', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'title', t.title,
                    'description', t.description,
                    'status', t.status,
                    'priority', t.priority,
                    'assignee', t.assignee,
                    'slug', t.slug,
                    'prefix', t.prefix,
                    'created_at', t.created_at,
                    'updated_at', t.updated_at
                )
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::jsonb
        )
    )::json INTO v_result
    FROM projects p
    LEFT JOIN project_members pm ON p.id = pm.project_id
    LEFT JOIN profiles prof_m ON pm.user_id = prof_m.id
    LEFT JOIN project_invitations pi ON p.id = pi.project_id
    LEFT JOIN profiles prof_i ON pi.invited_by = prof_i.id
    LEFT JOIN tasks t ON p.id = t.project_id
    WHERE p.id = new_project.id
    GROUP BY p.id, p.name, p.description, p.status, p.slug, p.prefix, 
             p.github_repo_url, p.github_owner, p.github_repo, p.created_at, p.updated_at;

    RETURN v_result;
END;
$$;