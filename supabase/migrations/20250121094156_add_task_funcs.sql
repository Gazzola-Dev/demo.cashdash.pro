DROP FUNCTION IF EXISTS public.get_task_data(text);
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
  SELECT json_build_object(
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
          'content_type', c.content_type,
          'content_id', c.content_id,
          'user_id', c.user_id,
          'content', c.content,
          'is_edited', c.is_edited,
          'parent_id', c.parent_id,
          'thread_id', c.thread_id,
          'user', to_jsonb(prof_c)
        )
      ) FILTER (WHERE c.id IS NOT NULL),
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
  LEFT JOIN comments c ON t.id = (c.content_id::uuid) AND c.content_type = 'task'
  LEFT JOIN profiles prof_c ON c.user_id = prof_c.id
  LEFT JOIN task_schedule ts ON t.id = ts.task_id
  LEFT JOIN profiles prof ON t.assignee = prof.id
  WHERE t.slug = task_slug
  GROUP BY t.id, p.id, prof.id;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_task_data(TEXT) TO authenticated;

DROP FUNCTION IF EXISTS public.list_project_tasks(text);
DROP FUNCTION IF EXISTS public.list_project_tasks(text, public.task_status, public.task_priority, uuid, text, text, text);
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
  WHERE p.slug = project_slug
  GROUP BY t.id, p.id, prof_a.id;
END;
$$;