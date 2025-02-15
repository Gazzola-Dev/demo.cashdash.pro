-- Drop existing function if it exists
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
    result json;
BEGIN
    -- Insert the new project
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

    -- Build the complete response with all relationships
    SELECT jsonb_build_object(
        'id', new_project.id,
        'name', new_project.name,
        'description', new_project.description,
        'status', new_project.status,
        'slug', new_project.slug,
        'prefix', new_project.prefix,
        'github_repo_url', new_project.github_repo_url,
        'github_owner', new_project.github_owner,
        'github_repo', new_project.github_repo,
        'created_at', new_project.created_at,
        'updated_at', new_project.updated_at,
        'project_members', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', pm.id,
                    'project_id', pm.project_id,
                    'user_id', pm.user_id,
                    'role', pm.role,
                    'created_at', pm.created_at,
                    'profile', (
                        SELECT jsonb_build_object(
                            'id', p.id,
                            'email', p.email,
                            'display_name', p.display_name,
                            'avatar_url', p.avatar_url,
                            'professional_title', p.professional_title
                        )
                        FROM profiles p
                        WHERE p.id = pm.user_id
                    )
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
                    'inviter', (
                        SELECT jsonb_build_object(
                            'id', p.id,
                            'email', p.email,
                            'display_name', p.display_name,
                            'avatar_url', p.avatar_url,
                            'professional_title', p.professional_title
                        )
                        FROM profiles p
                        WHERE p.id = pi.invited_by
                    )
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
        ),
        'external_integrations', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', ei.id,
                    'project_id', ei.project_id,
                    'provider', ei.provider,
                    'settings', ei.settings,
                    'credentials', ei.credentials
                )
            ) FILTER (WHERE ei.id IS NOT NULL),
            '[]'::jsonb
        ),
        'project_metrics', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', pm.id,
                    'project_id', pm.project_id,
                    'date', pm.date,
                    'velocity', pm.velocity,
                    'burn_rate_cents', pm.burn_rate_cents,
                    'completion_percentage', pm.completion_percentage
                )
            ) FILTER (WHERE pm.id IS NOT NULL),
            '[]'::jsonb
        )
    )::json INTO result
    FROM projects p
    LEFT JOIN project_members pm ON p.id = pm.project_id
    LEFT JOIN project_invitations pi ON p.id = pi.project_id
    LEFT JOIN tasks t ON p.id = t.project_id
    LEFT JOIN external_integrations ei ON p.id = ei.project_id
    LEFT JOIN project_metrics pmet ON p.id = pmet.project_id
    WHERE p.id = new_project.id
    GROUP BY p.id, p.name, p.description, p.status, p.slug, p.prefix,
             p.github_repo_url, p.github_owner, p.github_repo, p.created_at, p.updated_at;

    RETURN result;
END;
$$;