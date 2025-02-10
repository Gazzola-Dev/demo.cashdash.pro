-- Drop existing function
DROP FUNCTION IF EXISTS public.get_project_data(text);

-- Create updated get_project_data function
CREATE OR REPLACE FUNCTION public.get_project_data(project_slug TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  found_project projects;
  current_user_id uuid;
  debug_info jsonb;
  has_access boolean;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- First verify the project exists
  SELECT * INTO found_project
  FROM projects p
  WHERE p.slug = project_slug;

  IF found_project IS NULL THEN
    RAISE EXCEPTION 'Project not found with slug %', project_slug;
  END IF;

  -- Check if user has access through project_members
  SELECT EXISTS (
    SELECT 1 
    FROM project_members pm
    WHERE pm.project_id = found_project.id
    AND pm.user_id = current_user_id
  ) INTO has_access;

  -- Build debug info
  debug_info := jsonb_build_object(
    'debug_info', jsonb_build_object(
      'project_slug', project_slug,
      'project_id', found_project.id,
      'user_id', current_user_id,
      'has_access', has_access,
      'timestamp', now()
    )
  );

  -- Verify access
  IF NOT has_access THEN
    RAISE EXCEPTION 'Access denied: %', debug_info;
  END IF;

  -- Select project data with all relationships
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
      'debug', debug_info,
      'project_members', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', pm.id,
            'project_id', pm.project_id,
            'user_id', pm.user_id,
            'role', pm.role,
            'created_at', pm.created_at,
            'profile', CASE 
              WHEN member_profile.id IS NOT NULL THEN
                jsonb_build_object(
                  'id', member_profile.id,
                  'display_name', member_profile.display_name,
                  'avatar_url', member_profile.avatar_url,
                  'professional_title', member_profile.professional_title,
                  'email', member_profile.email
                )
              ELSE NULL
            END
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
            'inviter', CASE 
              WHEN inviter_profile.id IS NOT NULL THEN
                jsonb_build_object(
                  'id', inviter_profile.id,
                  'display_name', inviter_profile.display_name,
                  'avatar_url', inviter_profile.avatar_url,
                  'professional_title', inviter_profile.professional_title,
                  'email', inviter_profile.email
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
  LEFT JOIN project_members pm ON p.id = pm.project_id
  LEFT JOIN profiles member_profile ON pm.user_id = member_profile.id
  LEFT JOIN project_invitations pi ON p.id = pi.project_id
  LEFT JOIN profiles inviter_profile ON pi.invited_by = inviter_profile.id
  LEFT JOIN tasks t ON p.id = t.project_id
  LEFT JOIN external_integrations ei ON p.id = ei.project_id
  LEFT JOIN project_metrics pmet ON p.id = pmet.project_id
  WHERE p.id = found_project.id
  GROUP BY p.id;

  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_project_data(TEXT) TO authenticated;