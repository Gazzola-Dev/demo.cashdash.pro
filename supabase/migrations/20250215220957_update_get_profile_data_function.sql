-- Update get_profile_data function to fix duplicate projects issue
CREATE OR REPLACE FUNCTION public.get_profile_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  user_profile profiles;
  current_project projects;
BEGIN
  -- Get the current user's ID
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user profile
  SELECT * INTO user_profile
  FROM profiles
  WHERE id = auth.uid();

  -- Get current project if it exists
  IF user_profile.current_project_id IS NOT NULL THEN
    SELECT * INTO current_project
    FROM projects
    WHERE id = user_profile.current_project_id;
  END IF;

  -- Construct the response JSON
  SELECT json_build_object(
    'profile', user_profile,
    'current_project', CASE 
      WHEN current_project.id IS NOT NULL THEN
        json_build_object(
          'id', current_project.id,
          'name', current_project.name,
          'description', current_project.description,
          'status', current_project.status,
          'slug', current_project.slug,
          'prefix', current_project.prefix,
          'github_repo_url', current_project.github_repo_url,
          'github_owner', current_project.github_owner,
          'github_repo', current_project.github_repo,
          'created_at', current_project.created_at,
          'updated_at', current_project.updated_at,
          'project_members', (
            SELECT COALESCE(json_agg(row_to_json(pm)), '[]'::json)
            FROM (
              SELECT pm.*, row_to_json(p.*) as profile
              FROM project_members pm
              LEFT JOIN profiles p ON p.id = pm.user_id
              WHERE pm.project_id = current_project.id
            ) pm
          ),
          'project_invitations', (
            SELECT COALESCE(json_agg(row_to_json(pi)), '[]'::json)
            FROM (
              SELECT pi.*, row_to_json(p.*) as inviter
              FROM project_invitations pi
              LEFT JOIN profiles p ON p.id = pi.invited_by
              WHERE pi.project_id = current_project.id
            ) pi
          ),
          'tasks', (
            SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
            FROM tasks t
            WHERE t.project_id = current_project.id
          )
        )
      ELSE NULL
    END,
    'projects', (
      -- Get unique projects with role information using a subquery with DISTINCT ON
      SELECT COALESCE(json_agg(proj_data), '[]'::json)
      FROM (
        SELECT DISTINCT ON (p.id) json_build_object(
          'project', p,
          'role', pm.role,
          'created_at', pm.created_at
        ) as proj_data
        FROM project_members pm
        INNER JOIN projects p ON p.id = pm.project_id
        WHERE pm.user_id = auth.uid()
        ORDER BY p.id, pm.created_at DESC
      ) unique_projects
    ),
    'pending_invitations', (
      SELECT COALESCE(json_agg(invite_data), '[]'::json)
      FROM (
        SELECT json_build_object(
          'invitation', pi,
          'project', p,
          'inviter', prof
        ) as invite_data
        FROM project_invitations pi
        INNER JOIN projects p ON pi.project_id = p.id
        LEFT JOIN profiles prof ON pi.invited_by = prof.id
        WHERE pi.email = user_profile.email
        AND pi.status = 'pending'
      ) pending_invites
    )
  ) INTO result;

  RETURN result;
END;
$$;