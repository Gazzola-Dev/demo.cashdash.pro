CREATE OR REPLACE FUNCTION public.update_task_data(
  task_slug TEXT,
  task_updates JSONB
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_task tasks;
  updated_task tasks;
  result json;
BEGIN
  -- First verify the task exists and get its project_id
  SELECT * INTO found_task
  FROM tasks
  WHERE slug = task_slug;

  IF found_task IS NULL THEN
    RAISE EXCEPTION 'Task not found with slug %', task_slug;
  END IF;

  -- Update the task
  UPDATE tasks
  SET
    title = CASE 
      WHEN task_updates ? 'title' THEN (task_updates->>'title')::text
      ELSE title
    END,
    description = CASE 
      WHEN task_updates ? 'description' THEN (task_updates->>'description')::text
      ELSE description
    END,
    status = CASE 
      WHEN task_updates ? 'status' THEN (task_updates->>'status')::task_status
      ELSE status
    END,
    priority = CASE 
      WHEN task_updates ? 'priority' THEN (task_updates->>'priority')::task_priority
      ELSE priority
    END,
    assignee = CASE 
      WHEN task_updates ? 'assignee' THEN (task_updates->>'assignee')::uuid
      ELSE assignee
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE slug = task_slug
  RETURNING * INTO updated_task;

  -- Handle task_schedule updates if present
  IF task_updates ? 'task_schedule' THEN
    INSERT INTO task_schedule (
      task_id,
      start_date,
      due_date,
      estimated_hours,
      actual_hours
    )
    VALUES (
      updated_task.id,
      (task_updates->'task_schedule'->>'start_date')::timestamptz,
      (task_updates->'task_schedule'->>'due_date')::timestamptz,
      (task_updates->'task_schedule'->>'estimated_hours')::numeric,
      (task_updates->'task_schedule'->>'actual_hours')::numeric
    )
    ON CONFLICT (task_id) 
    DO UPDATE SET
      start_date = EXCLUDED.start_date,
      due_date = EXCLUDED.due_date,
      estimated_hours = EXCLUDED.estimated_hours,
      actual_hours = EXCLUDED.actual_hours;
  END IF;

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
    'task_schedule', to_jsonb(ts),
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
  GROUP BY t.id, p.id, prof.id, ts.id;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_task_data(TEXT, JSONB) TO authenticated;