-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_task_data(text);
DROP FUNCTION IF EXISTS public.list_project_tasks(text);

-- Recreate get_task_data function
CREATE OR REPLACE FUNCTION public.get_task_data(task_slug TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  found_task tasks;
BEGIN
  -- First verify the task exists
  SELECT * INTO found_task
  FROM tasks
  WHERE slug = task_slug;

  IF found_task IS NULL THEN
    RAISE EXCEPTION 'Task not found with slug %', task_slug;
  END IF;

  -- Select directly into result without the extra row_to_json wrapper
  WITH task_comments AS (
    -- Subquery to get distinct comments with their user profiles
    SELECT DISTINCT ON (c.id)
      jsonb_build_object(
        'id', c.id,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'content_type', c.content_type,
        'content_id', c.content_id,
        'user_id', c.user_id,
        'content', c.content,
        'is_edited', c.is_edited,
        'parent_id', c.parent_id,
        'thread_id', c.thread_id,
        'user', to_jsonb(prof_c)
      ) as comment_data
    FROM comments c
    LEFT JOIN profiles prof_c ON c.user_id = prof_c.id
    WHERE c.content_id = found_task.id::text 
    AND c.content_type = 'task'
    ORDER BY c.id, c.created_at DESC
  )
  SELECT json_build_object(
    'task', t,
    'project', p,
    'subtasks', COALESCE(
      array_agg(s) FILTER (WHERE s.id IS NOT NULL), 
      ARRAY[]::subtasks[]
    ),
    'comments', COALESCE(
      (SELECT jsonb_agg(comment_data)
       FROM task_comments),
      '[]'::jsonb
    ),
    'task_schedule', COALESCE(
      array_agg(ts) FILTER (WHERE ts.id IS NOT NULL),
      ARRAY[]::task_schedule[]
    ),
    'assignee_profile', prof
  ) INTO result
  FROM tasks t
  INNER JOIN projects p ON t.project_id = p.id
  LEFT JOIN subtasks s ON t.id = s.task_id
  LEFT JOIN task_schedule ts ON t.id = ts.task_id
  LEFT JOIN profiles prof ON t.assignee = prof.id
  WHERE t.slug = task_slug
  GROUP BY t.id, p.id, prof.id;

  RETURN result;
END;
$$;

-- Recreate list_project_tasks function
CREATE OR REPLACE FUNCTION public.list_project_tasks(project_slug text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH task_comments AS (
    -- Subquery to get distinct comments with their user profiles
    SELECT DISTINCT ON (c.id, c.content_id)
      c.content_id,
      jsonb_build_object(
        'id', c.id,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'content', c.content,
        'is_edited', c.is_edited,
        'user', to_jsonb(prof_c)
      ) as comment_data
    FROM comments c
    LEFT JOIN profiles prof_c ON c.user_id = prof_c.id
    WHERE c.content_type = 'task'
    ORDER BY c.id, c.content_id, c.created_at DESC
  )
  SELECT 
    jsonb_build_object(
      'task', t,
      'project', p,
      'subtasks', COALESCE(
        array_agg(DISTINCT s) FILTER (WHERE s.id IS NOT NULL),
        ARRAY[]::subtasks[]
      ),
      'comments', COALESCE(
        (SELECT jsonb_agg(tc.comment_data)
         FROM task_comments tc
         WHERE tc.content_id = t.id::text),
        '[]'::jsonb
      ),
      'task_schedule', COALESCE(
        array_agg(DISTINCT ts) FILTER (WHERE ts.id IS NOT NULL),
        ARRAY[]::task_schedule[]
      ),
      'assignee_profile', prof_a
    )::json
  FROM tasks t
  INNER JOIN projects p ON t.project_id = p.id
  LEFT JOIN subtasks s ON t.id = s.task_id
  LEFT JOIN task_schedule ts ON t.id = ts.task_id
  LEFT JOIN profiles prof_a ON t.assignee = prof_a.id
  WHERE p.slug = project_slug
  GROUP BY t.id, p.id, prof_a.id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_task_data(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_project_tasks(TEXT) TO authenticated;