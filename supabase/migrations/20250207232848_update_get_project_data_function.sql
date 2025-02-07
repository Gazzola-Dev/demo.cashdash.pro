-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_project_data(text);

-- Create function to get project data with all relationships
CREATE OR REPLACE FUNCTION public.get_project_data(project_slug TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  found_project projects;
BEGIN
  -- First verify the project exists
  SELECT * INTO found_project
  FROM projects
  WHERE slug = project_slug;

  IF found_project IS NULL THEN
    RAISE EXCEPTION 'Project not found with slug %', project_slug;
  END IF;

  -- Select project data with all relationships
  WITH project_members_clean AS (
    -- Subquery to get distinct members with essential profile data
    SELECT DISTINCT ON (pm.user_id)
      jsonb_build_object(
        'id', pm.id,
        'project_id', pm.project_id,
        'user_id', pm.user_id,
        'role', pm.role,
        'created_at', pm.created_at,
        'profile', CASE 
          WHEN prof.id IS NOT NULL THEN
            jsonb_build_object(
              'id', prof.id,
              'display_name', prof.display_name,
              'avatar_url', prof.avatar_url,
              'professional_title', prof.professional_title
            )
          ELSE NULL
        END
      ) as member_data
    FROM project_members pm
    LEFT JOIN profiles prof ON pm.user_id = prof.id
    WHERE pm.project_id = found_project.id
    ORDER BY pm.user_id, pm.created_at DESC
  )
  SELECT 
    jsonb_build_object(
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
        (SELECT jsonb_agg(member_data)
         FROM project_members_clean),
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
            'inviter', CASE 
              WHEN prof_i.id IS NOT NULL THEN
                jsonb_build_object(
                  'id', prof_i.id,
                  'display_name', prof_i.display_name,
                  'avatar_url', prof_i.avatar_url,
                  'professional_title', prof_i.professional_title
                )
              ELSE NULL
            END
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
            'id', pmet.id,
            'project_id', pmet.project_id,
            'date', pmet.date,
            'velocity', pmet.velocity,
            'burn_rate_cents', pmet.burn_rate_cents,
            'completion_percentage', pmet.completion_percentage
          )
        ) FILTER (WHERE pmet.id IS NOT NULL),
        '[]'::jsonb
      )
    )::json INTO result
  FROM projects p
  LEFT JOIN project_invitations pi ON p.id = pi.project_id
  LEFT JOIN profiles prof_i ON pi.invited_by = prof_i.id
  LEFT JOIN tasks t ON p.id = t.project_id
  LEFT JOIN external_integrations ei ON p.id = ei.project_id
  LEFT JOIN project_metrics pmet ON p.id = pmet.project_id
  WHERE p.id = found_project.id
  GROUP BY p.id;

  RETURN result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_project_data(TEXT) TO authenticated;