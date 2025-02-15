CREATE OR REPLACE FUNCTION public.update_project_data(
  p_project_id UUID,
  p_updates JSONB,
  p_user_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  user_role text;
BEGIN
  -- Check if user has admin/owner role for this project
  SELECT role INTO user_role
  FROM project_members
  WHERE project_id = p_project_id
    AND user_id = p_user_id
    AND role IN ('admin', 'owner');

  IF user_role IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User must be an admin or owner';
  END IF;

  -- Update the project
  UPDATE projects 
  SET
    name = COALESCE((p_updates->>'name')::text, name),
    description = COALESCE((p_updates->>'description')::text, description),
    status = COALESCE((p_updates->>'status')::project_status, status),
    prefix = COALESCE((p_updates->>'prefix')::text, prefix),
    github_repo_url = COALESCE((p_updates->>'github_repo_url')::text, github_repo_url),
    github_owner = COALESCE((p_updates->>'github_owner')::text, github_owner),
    github_repo = COALESCE((p_updates->>'github_repo')::text, github_repo),
    updated_at = now()
  WHERE id = p_project_id;

  -- Return updated project with all relationships
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
  )::json INTO result
  FROM projects p
  LEFT JOIN project_members pm ON p.id = pm.project_id
  LEFT JOIN profiles prof_m ON pm.user_id = prof_m.id
  LEFT JOIN project_invitations pi ON p.id = pi.project_id
  LEFT JOIN profiles prof_i ON pi.invited_by = prof_i.id
  LEFT JOIN tasks t ON p.id = t.project_id
  WHERE p.id = p_project_id
  GROUP BY p.id;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_project_data(UUID, JSONB, UUID) TO authenticated;