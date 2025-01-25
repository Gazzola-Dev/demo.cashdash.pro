-- Drop existing function
DROP FUNCTION IF EXISTS public.get_task_data(text);

-- Recreate get_task_data function with corrected task_schedule handling
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
    WHERE c.content_id = found_task.id
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
      (SELECT jsonb_agg(comment_data ORDER BY (comment_data->>'created_at') DESC)
       FROM task_comments),
      '[]'::jsonb
    ),
    -- Return task_schedule as a single object instead of an array
    'task_schedule', (
      SELECT to_jsonb(ts)
      FROM task_schedule ts
      WHERE ts.task_id = t.id
      LIMIT 1
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_task_data(TEXT) TO authenticated;