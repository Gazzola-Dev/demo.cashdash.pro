-- Improve authentication handling in database functions

-- Update get_app_data to use auth.uid() and add security checks
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
  -- Get the current user's ID from the JWT
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user profile
  WITH user_profile AS (
    SELECT * FROM profiles 
    WHERE id = v_user_id
  ),
  -- Get user's projects
  user_projects AS (
    SELECT DISTINCT p.* 
    FROM projects p
    INNER JOIN project_members pm ON p.id = pm.project_id
    WHERE pm.user_id = v_user_id
  ),
  -- Get current project details
  current_project AS (
    SELECT p.* 
    FROM projects p
    INNER JOIN profiles pr ON pr.current_project_id = p.id
    WHERE pr.id = v_user_id
  ),
  -- Get tasks for current project
  project_tasks AS (
    SELECT t.*, p.id as assignee_profile_id, p.display_name, p.avatar_url 
    FROM tasks t
    LEFT JOIN profiles p ON t.assignee = p.id
    WHERE t.project_id = (SELECT id FROM current_project)
  ),
  -- Get project invitations
  project_invites AS (
    SELECT pi.* 
    FROM project_invitations pi
    WHERE pi.project_id = (SELECT id FROM current_project)
  )
  -- Combine all data
  SELECT json_build_object(
    'profile', (SELECT row_to_json(up.*) FROM user_profile up),
    'projects', (SELECT json_agg(up.*) FROM user_projects up),
    'project', (
      SELECT row_to_json(cp.*) || jsonb_build_object(
        'project_members', (
          SELECT json_agg(row_to_json(pm.*))
          FROM project_members pm
          WHERE pm.project_id = cp.id
        ),
        'project_invitations', (
          SELECT json_agg(row_to_json(pi.*))
          FROM project_invites pi
        )
      )
      FROM current_project cp
    ),
    'tasks', (SELECT json_agg(row_to_json(pt.*)) FROM project_tasks pt),
    'invitations', (SELECT json_agg(row_to_json(pi.*)) FROM project_invites pi)
  ) INTO result;

  RETURN result;
END;
$$;

-- Update get_task to use auth.uid() and add security checks
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
  -- Get the current user's ID from the JWT
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find task by slug or ordinal_id
  WITH found_task AS (
    SELECT t.* FROM tasks t
    WHERE 
      CASE 
        WHEN task_identifier ~ '^\d+$' THEN 
          t.ordinal_id = task_identifier::integer
        ELSE 
          t.slug = task_identifier
      END
    LIMIT 1
  )
  -- Verify user has access to this task
  SELECT t.id INTO v_task_id
  FROM found_task t
  INNER JOIN project_members pm ON t.project_id = pm.project_id
  WHERE pm.user_id = v_user_id;

  IF v_task_id IS NULL THEN
    RAISE EXCEPTION 'Task not found or access denied';
  END IF;

  -- Get full task data with relationships
  WITH task_data AS (
    SELECT 
      t.*,
      p.id as assignee_profile_id,
      p.display_name as assignee_name,
      p.avatar_url as assignee_avatar
    FROM tasks t
    LEFT JOIN profiles p ON t.assignee = p.id
    WHERE t.id = v_task_id
  ),
  comment_data AS (
    SELECT 
      c.*,
      p.id as commenter_id,
      p.display_name as commenter_name,
      p.avatar_url as commenter_avatar
    FROM comments c
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.content_type = 'task' 
    AND c.content_id = v_task_id::text
  ),
  subtask_data AS (
    SELECT s.* 
    FROM subtasks s
    WHERE s.task_id = v_task_id
  )
  -- Combine all data
  SELECT json_build_object(
    'task', (SELECT row_to_json(t.*) FROM task_data t),
    'comments', (SELECT json_agg(row_to_json(c.*)) FROM comment_data c),
    'subtasks', (SELECT json_agg(row_to_json(s.*)) FROM subtask_data s)
  ) INTO result;

  RETURN result;
END;
$$;

-- Update update_profile_data to use auth.uid() and add security checks
CREATE OR REPLACE FUNCTION public.update_profile_data(
  p_user_id UUID,
  p_updates JSONB
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  updated_profile profiles;
  result json;
BEGIN
  -- Get the current user's ID from the JWT
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user is updating their own profile
  IF v_user_id != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized to update this profile';
  END IF;

  -- Update the profile
  UPDATE profiles
  SET
    display_name = COALESCE((p_updates->>'display_name'), display_name),
    avatar_url = COALESCE((p_updates->>'avatar_url'), avatar_url),
    professional_title = COALESCE((p_updates->>'professional_title'), professional_title),
    bio = COALESCE((p_updates->>'bio'), bio),
    github_username = COALESCE((p_updates->>'github_username'), github_username),
    timezone = COALESCE((p_updates->>'timezone'), timezone),
    website = COALESCE((p_updates->>'website'), website),
    notification_preferences = COALESCE((p_updates->>'notification_preferences')::jsonb, notification_preferences),
    ui_preferences = COALESCE((p_updates->>'ui_preferences')::jsonb, ui_preferences),
    current_project_id = COALESCE((p_updates->>'current_project_id')::uuid, current_project_id),
    updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO updated_profile;

  -- Return the updated profile
  SELECT row_to_json(updated_profile.*) INTO result;
  RETURN result;
END;
$$;