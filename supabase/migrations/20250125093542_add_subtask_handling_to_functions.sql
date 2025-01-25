-- Drop existing functions
DROP FUNCTION IF EXISTS public.update_task_data(text, jsonb);
DROP FUNCTION IF EXISTS public.get_task_data(text);
DROP FUNCTION IF EXISTS public.update_subtask_data(uuid, jsonb);

-- Create update_subtask_data function
CREATE OR REPLACE FUNCTION public.update_subtask_data(
  subtask_id UUID,
  subtask_updates JSONB
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_subtask subtasks;
  result json;
BEGIN
  -- Update the subtask
  UPDATE subtasks
  SET
    title = CASE 
      WHEN subtask_updates ? 'title' THEN (subtask_updates->>'title')::text
      ELSE title
    END,
    description = CASE 
      WHEN subtask_updates ? 'description' THEN (subtask_updates->>'description')::text
      ELSE description
    END,
    status = CASE 
      WHEN subtask_updates ? 'status' THEN (subtask_updates->>'status')::task_status
      ELSE status
    END,
    budget_cents = CASE 
      WHEN subtask_updates ? 'budget_cents' THEN (subtask_updates->>'budget_cents')::integer
      ELSE budget_cents
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = subtask_id
  RETURNING * INTO updated_subtask;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subtask not found with id %', subtask_id;
  END IF;

  -- Return the updated subtask data
  SELECT json_build_object(
    'subtask', updated_subtask
  ) INTO result;

  RETURN result;
END;
$$;

-- Create updated get_task_data function that includes subtasks
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

  -- Select directly into result with subtasks included
  WITH task_comments AS (
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
      array_agg(s ORDER BY s.ordinal_id) FILTER (WHERE s.id IS NOT NULL), 
      ARRAY[]::subtasks[]
    ),
    'comments', COALESCE(
      (SELECT jsonb_agg(comment_data ORDER BY (comment_data->>'created_at') DESC)
       FROM task_comments),
      '[]'::jsonb
    ),
    'task_schedule', ts,
    'assignee_profile', prof
  ) INTO result
  FROM tasks t
  INNER JOIN projects p ON t.project_id = p.id
  LEFT JOIN subtasks s ON t.id = s.task_id
  LEFT JOIN task_schedule ts ON t.id = ts.task_id
  LEFT JOIN profiles prof ON t.assignee = prof.id
  WHERE t.slug = task_slug
  GROUP BY t.id, p.id, prof.id, ts.id;

  RETURN result;
END;
$$;

-- Create updated update_task_data function that handles subtask updates
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
  -- First verify the task exists
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

  -- Handle subtask updates if present
  IF task_updates ? 'subtasks' AND jsonb_typeof(task_updates->'subtasks') = 'array' THEN
    FOR i IN 0..jsonb_array_length(task_updates->'subtasks')-1 LOOP
      DECLARE
        subtask_data jsonb := task_updates->'subtasks'->i;
        subtask_id uuid := (subtask_data->>'id')::uuid;
      BEGIN
        UPDATE subtasks
        SET
          title = COALESCE((subtask_data->>'title')::text, title),
          description = COALESCE((subtask_data->>'description')::text, description),
          status = COALESCE((subtask_data->>'status')::task_status, status),
          budget_cents = COALESCE((subtask_data->>'budget_cents')::integer, budget_cents),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = subtask_id AND task_id = updated_task.id;
      END;
    END LOOP;
  END IF;

  -- Return updated task data with all relationships
  SELECT json_build_object(
    'task', t,
    'project', p,
    'subtasks', COALESCE(
      array_agg(s ORDER BY s.ordinal_id) FILTER (WHERE s.id IS NOT NULL), 
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
    'task_schedule', ts,
    'assignee_profile', prof
  ) INTO result
  FROM tasks t
  INNER JOIN projects p ON t.project_id = p.id
  LEFT JOIN subtasks s ON t.id = s.task_id
  LEFT JOIN comments c ON t.id = c.content_id AND c.content_type = 'task'
  LEFT JOIN profiles prof_c ON c.user_id = prof_c.id
  LEFT JOIN task_schedule ts ON t.id = ts.task_id
  LEFT JOIN profiles prof ON t.assignee = prof.id
  WHERE t.id = updated_task.id
  GROUP BY t.id, p.id, prof.id, ts.id;

  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_task_data(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_task_data(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_subtask_data(UUID, JSONB) TO authenticated;