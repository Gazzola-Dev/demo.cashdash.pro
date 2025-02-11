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

  WITH project_data AS (
    SELECT 
      p.*,
      jsonb_build_object(
        'project_members', COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'id', pm.id,
              'project_id', pm.project_id,
              'user_id', pm.user_id,
              'role', pm.role,
              'created_at', pm.created_at,
              'profile', jsonb_build_object(
                'id', prof.id,
                'display_name', prof.display_name,
                'avatar_url', prof.avatar_url,
                'professional_title', prof.professional_title,
                'email', prof.email
              )
            )
          )
          FROM project_members pm
          LEFT JOIN profiles prof ON pm.user_id = prof.id
          WHERE pm.project_id = p.id),
        '[]'::jsonb
        ),
        'project_invitations', COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'id', pi.id,
              'project_id', pi.project_id,
              'email', pi.email,
              'role', pi.role,
              'status', pi.status,
              'created_at', pi.created_at,
              'expires_at', pi.expires_at,
              'inviter', jsonb_build_object(
                'id', prof_i.id,
                'display_name', prof_i.display_name,
                'avatar_url', prof_i.avatar_url,
                'professional_title', prof_i.professional_title,
                'email', prof_i.email
              )
            )
          )
          FROM project_invitations pi
          LEFT JOIN profiles prof_i ON pi.invited_by = prof_i.id
          WHERE pi.project_id = p.id
          AND pi.status = 'pending'),
        '[]'::jsonb
        ),
        'tasks', COALESCE(
          (SELECT jsonb_agg(
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
          )
          FROM tasks t
          WHERE t.project_id = p.id),
        '[]'::jsonb
        ),
        'external_integrations', COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'id', ei.id,
              'project_id', ei.project_id,
              'provider', ei.provider,
              'settings', ei.settings,
              'credentials', ei.credentials
            )
          )
          FROM external_integrations ei
          WHERE ei.project_id = p.id),
        '[]'::jsonb
        ),
        'project_metrics', COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'id', pmet.id,
              'project_id', pmet.project_id,
              'date', pmet.date,
              'velocity', pmet.velocity,
              'burn_rate_cents', pmet.burn_rate_cents,
              'completion_percentage', pmet.completion_percentage
            )
          )
          FROM project_metrics pmet
          WHERE pmet.project_id = p.id),
        '[]'::jsonb
        )
      ) as related_data
    FROM projects p
    WHERE p.id = found_project.id
  )
  SELECT json_build_object(
    'id', pd.id,
    'name', pd.name,
    'description', pd.description,
    'status', pd.status,
    'slug', pd.slug,
    'prefix', pd.prefix,
    'github_repo_url', pd.github_repo_url,
    'github_owner', pd.github_owner,
    'github_repo', pd.github_repo,
    'created_at', pd.created_at,
    'updated_at', pd.updated_at,
    'debug', debug_info,
    'project_members', pd.related_data->'project_members',
    'project_invitations', pd.related_data->'project_invitations',
    'tasks', pd.related_data->'tasks',
    'external_integrations', pd.related_data->'external_integrations',
    'project_metrics', pd.related_data->'project_metrics'
  ) INTO result
  FROM project_data pd;

  RETURN result;
END;
$$;