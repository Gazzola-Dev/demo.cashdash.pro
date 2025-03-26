-- Migration to fix the array handling in update_task_data function
DROP FUNCTION IF EXISTS public.update_task_data;

CREATE OR REPLACE FUNCTION public.update_task_data(
  task_id UUID,
  task_updates JSONB
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_task tasks;
  found_project projects;
  update_parts text[] := ARRAY[]::text[];
  sql_query text;
  subtask_updates JSONB;
  json_response JSONB;
  task_name_changed BOOLEAN := false;
BEGIN
  -- Get the task and project directly using the task_id
  SELECT t.* INTO found_task
  FROM tasks t
  WHERE t.id = task_id;
  
  IF found_task IS NULL THEN
    RAISE EXCEPTION 'Task not found with ID: %', task_id;
  END IF;
  
  SELECT p.* INTO found_project
  FROM projects p
  WHERE p.id = found_task.project_id;
  
  -- Check if the calling user has permission to update this task
  -- This replaces RLS with explicit permission check
  IF NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = found_task.project_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You do not have permission to update this task';
  END IF;
  
  -- Process task updates based on the expected shape
  IF task_updates ? 'title' AND (task_updates->>'title') IS NOT NULL AND (task_updates->>'title') <> found_task.title THEN
    update_parts := array_append(update_parts, 'title = ' || quote_literal(task_updates->>'title'));
    task_name_changed := true;
  END IF;
  
  IF task_updates ? 'description' AND (task_updates->>'description') IS DISTINCT FROM found_task.description THEN
    update_parts := array_append(update_parts, 'description = ' || quote_literal(task_updates->>'description'));
  END IF;
  
  IF task_updates ? 'status' AND (task_updates->>'status') IS NOT NULL AND (task_updates->>'status') <> found_task.status::text THEN
    update_parts := array_append(update_parts, 'status = ' || quote_literal(task_updates->>'status'));
  END IF;
  
  IF task_updates ? 'priority' AND (task_updates->>'priority') IS NOT NULL AND (task_updates->>'priority') <> found_task.priority::text THEN
    update_parts := array_append(update_parts, 'priority = ' || quote_literal(task_updates->>'priority'));
  END IF;
  
  IF task_updates ? 'assignee' THEN
    IF (task_updates->>'assignee') IS NULL THEN
      update_parts := array_append(update_parts, 'assignee = NULL');
    ELSIF (task_updates->>'assignee') <> COALESCE(found_task.assignee::text, '') THEN
      update_parts := array_append(update_parts, 'assignee = ' || quote_literal(task_updates->>'assignee'));
    END IF;
  END IF;
  
  IF task_updates ? 'budget_cents' THEN
    IF (task_updates->>'budget_cents') IS NULL THEN
      update_parts := array_append(update_parts, 'budget_cents = NULL');
    ELSIF (task_updates->>'budget_cents')::numeric IS DISTINCT FROM found_task.budget_cents THEN
      update_parts := array_append(update_parts, 'budget_cents = ' || (task_updates->>'budget_cents'));
    END IF;
  END IF;
  
  IF task_updates ? 'estimated_minutes' THEN
    IF (task_updates->>'estimated_minutes') IS NULL THEN
      update_parts := array_append(update_parts, 'estimated_minutes = NULL');
    ELSIF (task_updates->>'estimated_minutes')::numeric IS DISTINCT FROM found_task.estimated_minutes THEN
      update_parts := array_append(update_parts, 'estimated_minutes = ' || (task_updates->>'estimated_minutes'));
    END IF;
  END IF;
  
  IF task_updates ? 'recorded_minutes' THEN
    IF (task_updates->>'recorded_minutes') IS NULL THEN
      update_parts := array_append(update_parts, 'recorded_minutes = NULL');
    ELSIF (task_updates->>'recorded_minutes')::numeric IS DISTINCT FROM found_task.recorded_minutes THEN
      update_parts := array_append(update_parts, 'recorded_minutes = ' || (task_updates->>'recorded_minutes'));
    END IF;
  END IF;
  
  IF task_updates ? 'start_time' THEN
    IF (task_updates->>'start_time') IS NULL THEN
      update_parts := array_append(update_parts, 'start_time = NULL');
    ELSIF (task_updates->>'start_time')::numeric IS DISTINCT FROM found_task.start_time THEN
      update_parts := array_append(update_parts, 'start_time = ' || (task_updates->>'start_time'));
    END IF;
  END IF;
  
  IF task_updates ? 'ordinal_priority' AND (task_updates->>'ordinal_priority')::numeric IS DISTINCT FROM found_task.ordinal_priority THEN
    update_parts := array_append(update_parts, 'ordinal_priority = ' || (task_updates->>'ordinal_priority'));
  END IF;
  
  -- Generate and execute the dynamic update query if there are updates
  IF array_length(update_parts, 1) > 0 THEN
    sql_query := 'UPDATE public.tasks SET ' || 
                 array_to_string(update_parts, ', ') || 
                 ', updated_at = NOW() WHERE id = $1 RETURNING *';
    
    EXECUTE sql_query INTO found_task USING task_id;
  END IF;
  
  -- Handle subtask updates if present
  IF task_updates ? 'subtasks' THEN
    subtask_updates := task_updates->'subtasks';
    -- Process subtask updates logic here
    -- This part would depend on your subtask structure
  END IF;
  
  -- Return the updated task data
  SELECT jsonb_build_object(
    'task', row_to_json(found_task),
    'project', row_to_json(found_project)
  ) INTO json_response;
  
  RETURN json_response;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.update_task_data(UUID, JSONB) TO authenticated;