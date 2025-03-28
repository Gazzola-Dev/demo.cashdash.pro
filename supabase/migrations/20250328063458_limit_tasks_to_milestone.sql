-- Migration to update task-related functions to filter by current_milestone_id

-- Update the list_project_tasks function
CREATE OR REPLACE FUNCTION public.list_project_tasks(project_slug text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'task', t,
      'project', p,
      'subtasks', COALESCE(
        array_agg(s) FILTER (WHERE s.id IS NOT NULL),
        ARRAY[]::subtasks[]
      ),
      'comments', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'created_at', c.created_at,
            'updated_at', c.updated_at,
            'content', c.content,
            'is_edited', c.is_edited,
            'user', prof_c
          )
        ) FILTER (WHERE c.id IS NOT NULL),
        '[]'::jsonb
      ),
      'task_schedule', COALESCE(
        array_agg(ts) FILTER (WHERE ts.id IS NOT NULL),
        ARRAY[]::task_schedule[]
      ),
      'assignee_profile', prof_a
    )::json
  FROM tasks t
  INNER JOIN projects p ON t.project_id = p.id
  LEFT JOIN subtasks s ON t.id = s.task_id
  LEFT JOIN comments c ON t.id = (c.content_id::uuid) AND c.content_type = 'task'
  LEFT JOIN profiles prof_c ON c.user_id = prof_c.id
  LEFT JOIN task_schedule ts ON t.id = ts.task_id
  LEFT JOIN profiles prof_a ON t.assignee = prof_a.id
  -- Filter tasks related to the current milestone
  WHERE p.slug = project_slug
  AND (
    p.current_milestone_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM milestone_tasks mt 
      WHERE mt.task_id = t.id AND mt.milestone_id = p.current_milestone_id
    )
  )
  GROUP BY t.id, p.id, prof_a.id;
END;
$$;

-- Update the get_task_data function
CREATE OR REPLACE FUNCTION public.get_task_data(task_slug TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT 
    jsonb_build_object(
      'task', t,
      'project', p,
      'subtasks', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'description', s.description,
            'status', s.status,
            'budget_cents', s.budget_cents,
            'ordinal_id', s.ordinal_id,
            'created_at', s.created_at,
            'updated_at', s.updated_at
          ) ORDER BY s.ordinal_id
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'::jsonb
      ),
      'comments', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'created_at', c.created_at,
            'updated_at', c.updated_at,
            'content', c.content,
            'is_edited', c.is_edited,
            'user', jsonb_build_object(
              'id', prof_c.id,
              'display_name', prof_c.display_name,
              'avatar_url', prof_c.avatar_url,
              'professional_title', prof_c.professional_title
            )
          ) ORDER BY c.created_at
        ) FILTER (WHERE c.id IS NOT NULL),
        '[]'::jsonb
      ),
      'task_schedule', ts,
      'assignee_profile', CASE WHEN prof_a.id IS NOT NULL THEN 
        jsonb_build_object(
          'id', prof_a.id,
          'display_name', prof_a.display_name,
          'avatar_url', prof_a.avatar_url,
          'professional_title', prof_a.professional_title
        )
      ELSE NULL END,
      'in_current_milestone', (
        p.current_milestone_id IS NOT NULL AND
        EXISTS (
          SELECT 1 FROM milestone_tasks mt 
          WHERE mt.task_id = t.id AND mt.milestone_id = p.current_milestone_id
        )
      )
    )::json INTO result
  FROM tasks t
  JOIN projects p ON t.project_id = p.id
  LEFT JOIN subtasks s ON t.id = s.task_id
  LEFT JOIN comments c ON t.id = (c.content_id::uuid) AND c.content_type = 'task'
  LEFT JOIN profiles prof_c ON c.user_id = prof_c.id
  LEFT JOIN task_schedule ts ON t.id = ts.task_id
  LEFT JOIN profiles prof_a ON t.assignee = prof_a.id
  WHERE t.slug = task_slug
  GROUP BY t.id, p.id, ts.id, prof_a.id;

  -- Ensure the user has access to the project
  PERFORM 1
  FROM projects p
  JOIN tasks t ON t.project_id = p.id
  JOIN project_members pm ON pm.project_id = p.id
  WHERE t.slug = task_slug
  AND pm.user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found or no access';
  END IF;

  RETURN result;
END;
$$;

-- Update the get_priority_tasks_data function
CREATE OR REPLACE FUNCTION public.get_priority_tasks_data(p_limit integer DEFAULT 5)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  result json;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the user's profile with current project ID
  WITH user_profile AS (
    SELECT 
      p.id, 
      p.current_project_id
    FROM profiles p
    WHERE p.id = v_user_id
  ),
  -- Get the current project
  current_project AS (
    SELECT 
      pr.id,
      pr.name,
      pr.slug,
      pr.current_milestone_id
    FROM projects pr
    JOIN user_profile up ON pr.id = up.current_project_id
    WHERE pr.id = up.current_project_id
  ),
  -- Get high priority tasks assigned to the user in the current project
  priority_tasks AS (
    SELECT 
      t.id,
      t.title,
      t.status,
      t.priority,
      t.created_at,
      t.updated_at,
      t.slug,
      p.name as project_name,
      p.slug as project_slug
    FROM tasks t
    JOIN current_project p ON t.project_id = p.id
    LEFT JOIN milestone_tasks mt ON t.id = mt.task_id
    WHERE t.assignee = v_user_id
    AND t.status NOT IN ('completed', 'cancelled')
    AND t.priority IN ('high', 'urgent')
    AND (
      p.current_milestone_id IS NULL 
      OR mt.milestone_id = p.current_milestone_id
    )
    ORDER BY 
      CASE t.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        ELSE 3 
      END,
      t.updated_at DESC
    LIMIT p_limit
  )
  SELECT json_build_object(
    'current_project', (
      SELECT row_to_json(cp) FROM current_project cp
    ),
    'priority_tasks', COALESCE(
      (SELECT json_agg(pt) FROM priority_tasks pt),
      '[]'::json
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Update the get_recent_tasks_data function
CREATE OR REPLACE FUNCTION public.get_recent_tasks_data(p_limit integer DEFAULT 5)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  result json;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the user's profile with current project ID
  WITH user_profile AS (
    SELECT 
      p.id, 
      p.current_project_id
    FROM profiles p
    WHERE p.id = v_user_id
  ),
  -- Get the current project
  current_project AS (
    SELECT 
      pr.id,
      pr.name,
      pr.slug,
      pr.current_milestone_id
    FROM projects pr
    JOIN user_profile up ON pr.id = up.current_project_id
    WHERE pr.id = up.current_project_id
  ),
  -- Get recently updated tasks in the current project
  recent_tasks AS (
    SELECT 
      t.id,
      t.title,
      t.status,
      t.priority,
      t.created_at,
      t.updated_at,
      t.slug,
      p.name as project_name,
      p.slug as project_slug
    FROM tasks t
    JOIN current_project p ON t.project_id = p.id
    LEFT JOIN milestone_tasks mt ON t.id = mt.task_id
    WHERE t.status NOT IN ('completed', 'cancelled')
    AND (
      p.current_milestone_id IS NULL 
      OR mt.milestone_id = p.current_milestone_id
    )
    ORDER BY t.updated_at DESC
    LIMIT p_limit
  )
  SELECT json_build_object(
    'current_project', (
      SELECT row_to_json(cp) FROM current_project cp
    ),
    'recent_tasks', COALESCE(
      (SELECT json_agg(rt) FROM recent_tasks rt),
      '[]'::json
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Update the list_tasks function
CREATE OR REPLACE FUNCTION public.list_tasks(
  p_project_id uuid DEFAULT NULL::uuid,
  p_status text DEFAULT NULL::text,
  p_priority text DEFAULT NULL::text,
  p_assignee uuid DEFAULT NULL::uuid,
  p_search text DEFAULT NULL::text,
  p_sort_column text DEFAULT 'ordinal_priority'::text,
  p_sort_order text DEFAULT 'asc'::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  WITH filtered_tasks AS (
    SELECT t.*
    FROM tasks t
    LEFT JOIN profiles p ON t.assignee = p.id
    LEFT JOIN projects pr ON t.project_id = pr.id
    LEFT JOIN milestone_tasks mt ON t.id = mt.task_id
    WHERE
      (p_project_id IS NULL OR t.project_id = p_project_id) AND
      (p_status IS NULL OR t.status::text = p_status) AND
      (p_priority IS NULL OR t.priority::text = p_priority) AND
      (p_assignee IS NULL OR t.assignee = p_assignee) AND
      (p_search IS NULL OR t.title ILIKE '%' || p_search || '%' OR t.description ILIKE '%' || p_search || '%') AND
      (
        pr.current_milestone_id IS NULL 
        OR mt.milestone_id = pr.current_milestone_id
      )
  ),
  sorted_tasks AS (
    SELECT
      t.*,
      pr.name as project_name,
      pr.slug as project_slug,
      COALESCE(p.display_name, 'Unassigned') as assignee_name,
      p.avatar_url as assignee_avatar,
      (
        SELECT COUNT(*) 
        FROM subtasks s 
        WHERE s.task_id = t.id
      ) as subtask_count,
      (
        SELECT COUNT(*) 
        FROM subtasks s 
        WHERE s.task_id = t.id AND s.status = 'completed'
      ) as completed_subtask_count
    FROM filtered_tasks t
    LEFT JOIN profiles p ON t.assignee = p.id
    LEFT JOIN projects pr ON t.project_id = pr.id
    ORDER BY
      CASE WHEN p_sort_order = 'asc' THEN
        CASE p_sort_column
          WHEN 'title' THEN t.title
          WHEN 'status' THEN t.status::text
          WHEN 'priority' THEN t.priority::text
          WHEN 'assignee' THEN COALESCE(p.display_name, '')
          WHEN 'created_at' THEN t.created_at::text
          WHEN 'updated_at' THEN t.updated_at::text
          WHEN 'ordinal_priority' THEN t.ordinal_priority::text
          ELSE t.ordinal_priority::text
        END
      END ASC NULLS LAST,
      CASE WHEN p_sort_order = 'desc' OR p_sort_order IS NULL THEN
        CASE p_sort_column
          WHEN 'title' THEN t.title
          WHEN 'status' THEN t.status::text
          WHEN 'priority' THEN t.priority::text
          WHEN 'assignee' THEN COALESCE(p.display_name, '')
          WHEN 'created_at' THEN t.created_at::text
          WHEN 'updated_at' THEN t.updated_at::text
          WHEN 'ordinal_priority' THEN t.ordinal_priority::text
          ELSE t.ordinal_priority::text
        END
      END DESC NULLS LAST
  )
  SELECT json_build_object(
    'tasks', COALESCE(
      json_agg(
        json_build_object(
          'id', t.id,
          'title', t.title,
          'description', t.description,
          'status', t.status,
          'priority', t.priority,
          'assignee', t.assignee,
          'project_id', t.project_id,
          'created_at', t.created_at,
          'updated_at', t.updated_at,
          'slug', t.slug,
          'prefix', t.prefix,
          'ordinal_id', t.ordinal_id,
          'ordinal_priority', t.ordinal_priority,
          'project_name', t.project_name,
          'project_slug', t.project_slug,
          'assignee_name', t.assignee_name,
          'assignee_avatar', t.assignee_avatar,
          'subtask_count', t.subtask_count,
          'completed_subtask_count', t.completed_subtask_count
        )
      ),
      '[]'::json
    ),
    'total', (SELECT COUNT(*) FROM filtered_tasks)
  ) INTO result;

  RETURN result;
END;
$$;

-- Add helper function to check if a task is in the current milestone
CREATE OR REPLACE FUNCTION public.is_task_in_current_milestone(task_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_current_milestone_id UUID;
  v_is_in_milestone BOOLEAN;
BEGIN
  -- Get the project ID and current milestone ID
  SELECT t.project_id, p.current_milestone_id
  INTO v_project_id, v_current_milestone_id
  FROM tasks t
  JOIN projects p ON t.project_id = p.id
  WHERE t.id = task_id;
  
  -- If there's no current milestone, return true (don't filter)
  IF v_current_milestone_id IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if the task is in the current milestone
  SELECT EXISTS (
    SELECT 1 
    FROM milestone_tasks mt 
    WHERE mt.task_id = task_id 
    AND mt.milestone_id = v_current_milestone_id
  ) INTO v_is_in_milestone;
  
  RETURN v_is_in_milestone;
END;
$$;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.is_task_in_current_milestone(UUID) TO authenticated;