CREATE OR REPLACE FUNCTION public.get_profile_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Get the current user's ID
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  WITH user_profile AS (
    SELECT p.*,
           jsonb_build_object(
             'id', cp.id,
             'name', cp.name,
             'description', cp.description,
             'status', cp.status,
             'slug', cp.slug,
             'prefix', cp.prefix,
             'github_repo_url', cp.github_repo_url,
             'github_owner', cp.github_owner,
             'github_repo', cp.github_repo,
             'created_at', cp.created_at,
             'updated_at', cp.updated_at,
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
                   'ordinal_id', t.ordinal_id,
                   'created_at', t.created_at,
                   'updated_at', t.updated_at
                 )
               ) FILTER (WHERE t.id IS NOT NULL),
               '[]'::jsonb
             )
           ) as current_project,
           jsonb_agg(
             jsonb_build_object(
               'project', pr,
               'role', pm.role,
               'created_at', pm.created_at
             )
           ) FILTER (WHERE pr.id IS NOT NULL) as projects,
           jsonb_agg(
             jsonb_build_object(
               'invitation', pi,
               'project', pip,
               'inviter', pi_prof
             )
           ) FILTER (WHERE pi.id IS NOT NULL) as pending_invitations
    FROM profiles p
    LEFT JOIN projects cp ON p.current_project_id = cp.id
    LEFT JOIN tasks t ON t.project_id = cp.id
    LEFT JOIN project_members pm ON pm.user_id = p.id
    LEFT JOIN projects pr ON pm.project_id = pr.id
    LEFT JOIN project_invitations pi ON pi.email = p.email AND pi.status = 'pending'
    LEFT JOIN projects pip ON pi.project_id = pip.id
    LEFT JOIN profiles pi_prof ON pi.invited_by = pi_prof.id
    WHERE p.id = auth.uid()
    GROUP BY p.id, cp.id
  )
  SELECT json_build_object(
    'profile', up,
    'current_project', up.current_project,
    'projects', COALESCE(up.projects, '[]'),
    'pending_invitations', COALESCE(up.pending_invitations, '[]')
  )
  INTO result
  FROM user_profile up;

  RETURN result;
END;
$$;