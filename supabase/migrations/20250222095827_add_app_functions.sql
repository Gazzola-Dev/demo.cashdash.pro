-- Migration to create app data fetching functions
-- Squash and replace any existing functions

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_app_data();
DROP FUNCTION IF EXISTS public.get_task(task_identifier TEXT);

-- Create get_app_data function
CREATE OR REPLACE FUNCTION public.get_app_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  result json;
BEGIN
  -- Get the current user's ID using auth.uid()
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT 
    json_build_object(
      -- Get profile data
      'profile', (
        SELECT row_to_json(p.*)
        FROM profiles p
        WHERE p.id = v_user_id
      ),
      
      -- Get all projects list
      'projects', (
        SELECT json_agg(p.*)
        FROM projects p
        INNER JOIN project_members pm ON pm.project_id = p.id
        WHERE pm.user_id = v_user_id
      ),
      
      -- Get current project with full details
      'project', (
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
          'icon_name', p.icon_name,
          'icon_color_fg', p.icon_color_fg,
          'icon_color_bg', p.icon_color_bg,
          'project_members', COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', pm.id,
                'project_id', pm.project_id,
                'user_id', pm.user_id,
                'role', pm.role,
                'created_at', pm.created_at,
                'profile', prof
              )
            )
            FROM project_members pm
            LEFT JOIN profiles prof ON prof.id = pm.user_id
            WHERE pm.project_id = p.id),
            '[]'::json
          ),
          'project_invitations', COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', pi.id,
                'project_id', pi.project_id,
                'email', pi.email,
                'role', pi.role,
                'status', pi.status,
                'invited_by', pi.invited_by,
                'created_at', pi.created_at,
                'expires_at', pi.expires_at,
                'profile', NULL
              )
            )
            FROM project_invitations pi
            WHERE pi.project_id = p.id),
            '[]'::json
          )
        )
        FROM profiles prof
        LEFT JOIN projects p ON p.id = prof.current_project_id
        WHERE prof.id = v_user_id
      ),

      -- Get tasks for current project
      'tasks', COALESCE(
        (SELECT json_agg(
          json_build_object(
            'id', t.id,
            'title', t.title,
            'description', t.description,
            'status', t.status,
            'priority', t.priority,
            'assignee', t.assignee,
            'project_id', t.project_id,
            'prefix', t.prefix,
            'slug', t.slug,
            'ordinal_id', t.ordinal_id,
            'ordinal_priority', t.ordinal_priority,
            'budget_cents', t.budget_cents,
            'estimated_minutes', t.estimated_minutes,
            'recorded_minutes', t.recorded_minutes,
            'start_time', t.start_time,
            'created_at', t.created_at,
            'updated_at', t.updated_at,
            'assignee_profile', (
              SELECT row_to_json(prof.*)
              FROM profiles prof
              WHERE prof.id = t.assignee
            )
          )
        )
        FROM tasks t
        INNER JOIN profiles prof ON prof.current_project_id = t.project_id
        WHERE prof.id = v_user_id),
        '[]'::json
      ),
      
      -- Get invitations
      'invitations', COALESCE(
        (SELECT json_agg(pi.*)
        FROM project_invitations pi
        INNER JOIN profiles prof ON prof.email = pi.email
        WHERE prof.id = v_user_id
        AND pi.status = 'pending'),
        '[]'::json
      )
    ) INTO result;

  RETURN result;
END;
$$;

-- Create get_task function
CREATE OR REPLACE FUNCTION public.get_task(task_identifier TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_task_id UUID;
  result json;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find task by either slug or ordinal_id
  SELECT id INTO v_task_id
  FROM tasks t
  WHERE t.slug = task_identifier
  OR t.ordinal_id::text = task_identifier;

  -- Verify user has access to the task's project
  IF NOT EXISTS (
    SELECT 1
    FROM tasks t
    INNER JOIN project_members pm ON pm.project_id = t.project_id
    WHERE t.id = v_task_id
    AND pm.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Not authorized to access this task';
  END IF;

  -- Get full task data matching TaskComplete interface
  SELECT json_build_object(
    'id', t.id,
    'title', t.title,
    'description', t.description,
    'status', t.status,
    'priority', t.priority,
    'assignee', t.assignee,
    'project_id', t.project_id,
    'prefix', t.prefix,
    'slug', t.slug,
    'ordinal_id', t.ordinal_id,
    'ordinal_priority', t.ordinal_priority,
    'budget_cents', t.budget_cents,
    'estimated_minutes', t.estimated_minutes,
    'recorded_minutes', t.recorded_minutes,
    'start_time', t.start_time,
    'created_at', t.created_at,
    'updated_at', t.updated_at,
    'assignee_profile', (
      SELECT row_to_json(prof.*)
      FROM profiles prof
      WHERE prof.id = t.assignee
    ),
    'comments', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', c.id,
          'content', c.content,
          'content_id', c.content_id,
          'content_type', c.content_type,
          'created_at', c.created_at,
          'updated_at', c.updated_at,
          'is_edited', c.is_edited,
          'user_id', c.user_id,
          'parent_id', c.parent_id,
          'thread_id', c.thread_id,
          'user', (
            SELECT row_to_json(prof.*)
            FROM profiles prof
            WHERE prof.id = c.user_id
          )
        )
      )
      FROM comments c
      WHERE c.content_id = t.id::text
      AND c.content_type = 'task'),
      '[]'::json
    ),
    'subtasks', COALESCE(
      (SELECT json_agg(s.*)
      FROM subtasks s
      WHERE s.task_id = t.id),
      '[]'::json
    )
  ) INTO result
  FROM tasks t
  WHERE t.id = v_task_id;

  RETURN result;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_app_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_task(TEXT) TO authenticated;