-- Make task_id UNIQUE in task_schedule table
ALTER TABLE task_schedule ADD CONSTRAINT task_schedule_task_id_key UNIQUE (task_id);

-- Update the update_task_data function to handle task schedule updates correctly
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
    IF jsonb_array_length(task_updates->'task_schedule') > 0 THEN
      -- Get the first schedule item
      WITH schedule_data AS (
        SELECT *
        FROM jsonb_to_record((task_updates->'task_schedule'->0) ) AS x(
          id uuid,
          due_date timestamp with time zone,
          start_date timestamp with time zone,
          estimated_hours numeric,
          actual_hours numeric
        )
      )
      -- Update or insert task schedule
      INSERT INTO task_schedule (
        task_id,
        due_date,
        start_date,
        estimated_hours,
        actual_hours
      )
      SELECT 
        updated_task.id,
        schedule_data.due_date,
        schedule_data.start_date,
        schedule_data.estimated_hours,
        schedule_data.actual_hours
      FROM schedule_data
      ON CONFLICT (task_id) 
      DO UPDATE SET
        due_date = EXCLUDED.due_date,
        start_date = EXCLUDED.start_date,
        estimated_hours = EXCLUDED.estimated_hours,
        actual_hours = EXCLUDED.actual_hours;
    END IF;
  END IF;

  -- Select and return the updated task data with all related info
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