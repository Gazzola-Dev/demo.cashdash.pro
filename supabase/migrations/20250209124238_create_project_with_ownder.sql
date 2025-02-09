-- Drop existing function
DROP FUNCTION IF EXISTS public.create_project_with_owner;

-- Create updated function
CREATE OR REPLACE FUNCTION public.create_project_with_owner(
  p_name TEXT,
  p_description TEXT,
  p_prefix TEXT,
  p_slug TEXT,
  p_owner_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_project projects;
  result json;
BEGIN
  -- First verify user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_owner_id
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can create projects';
  END IF;

  -- Insert the project
  INSERT INTO projects (
    name,
    description,
    prefix,
    slug,
    status
  )
  VALUES (
    p_name,
    p_description,
    p_prefix,
    p_slug,
    'active'
  )
  RETURNING * INTO v_new_project;

  -- Add the creator as project owner
  INSERT INTO project_members (
    project_id,
    user_id,
    role
  ) VALUES (
    v_new_project.id,
    p_owner_id,
    'owner'
  );

  -- Set as user's current project
  UPDATE profiles
  SET current_project_id = v_new_project.id
  WHERE id = p_owner_id;

  -- Return complete project data
  SELECT json_build_object(
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
    'project_invitations', '[]'::jsonb,
    'tasks', '[]'::jsonb,
    'external_integrations', '[]'::jsonb,
    'project_metrics', '[]'::jsonb
  ) INTO result
  FROM projects p
  LEFT JOIN project_members pm ON p.id = pm.project_id
  LEFT JOIN profiles prof_m ON pm.user_id = prof_m.id
  WHERE p.id = v_new_project.id
  GROUP BY p.id;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_project_with_owner(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;