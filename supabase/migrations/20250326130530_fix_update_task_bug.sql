-- Fix infinite recursion in project_members policy
-- First drop the problematic policies
DROP POLICY IF EXISTS "user_view_project_memberships" ON project_members;
DROP POLICY IF EXISTS "admin_manage_project_members" ON project_members;

-- Create new policies that avoid recursion
CREATE POLICY "user_view_project_memberships" 
ON project_members
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members direct_pm 
        WHERE direct_pm.project_id = project_members.project_id 
        AND direct_pm.user_id = auth.uid()
    )
);

CREATE POLICY "admin_manage_project_members"
ON project_members
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members admin_pm
        WHERE admin_pm.project_id = project_members.project_id
        AND admin_pm.user_id = auth.uid()
        AND admin_pm.role IN ('owner', 'admin')
    )
);

-- Create or replace update_task_data function with improved security and validation
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
  task_project_id UUID;
  user_role TEXT;
  result json;
BEGIN
  -- Check if the user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Find the task and its project
  SELECT t.* INTO found_task
  FROM tasks t
  WHERE t.slug = task_slug;
  
  IF found_task IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', task_slug;
  END IF;
  
  task_project_id := found_task.project_id;
  
  -- Check if the user has access to the project
  SELECT pm.role INTO user_role
  FROM project_members pm
  WHERE pm.project_id = task_project_id
  AND pm.user_id = auth.uid();
  
  IF user_role IS NULL THEN
    RAISE EXCEPTION 'Access denied: You are not a member of this project';
  END IF;
  
  -- Apply task updates with validation
  UPDATE tasks
  SET
    title = CASE WHEN task_updates ? 'title' THEN task_updates->>'title' ELSE title END,
    description = CASE WHEN task_updates ? 'description' THEN task_updates->>'description' ELSE description END,
    status = CASE 
              WHEN task_updates ? 'status' AND 
                   task_updates->>'status' IN ('draft', 'backlog', 'todo', 'in_progress', 'in_review', 'completed') 
              THEN (task_updates->>'status')::task_status
              ELSE status 
            END,
    priority = CASE 
                WHEN task_updates ? 'priority' AND 
                     task_updates->>'priority' IN ('low', 'medium', 'high', 'urgent') 
                THEN (task_updates->>'priority')::task_priority
                ELSE priority 
              END,
    assignee = CASE WHEN task_updates ? 'assignee' THEN 
                    CASE WHEN task_updates->>'assignee' = 'null' THEN NULL
                    ELSE (task_updates->>'assignee')::UUID END
                ELSE assignee END,
    start_date = CASE WHEN task_updates ? 'start_date' THEN 
                     CASE WHEN task_updates->>'start_date' = 'null' THEN NULL
                     ELSE (task_updates->>'start_date')::TIMESTAMPTZ END
                 ELSE start_date END,
    due_date = CASE WHEN task_updates ? 'due_date' THEN 
                   CASE WHEN task_updates->>'due_date' = 'null' THEN NULL
                   ELSE (task_updates->>'due_date')::TIMESTAMPTZ END
               ELSE due_date END,
    estimated_hours = CASE WHEN task_updates ? 'estimated_hours' THEN 
                          CASE WHEN task_updates->>'estimated_hours' = 'null' THEN NULL
                          ELSE (task_updates->>'estimated_hours')::NUMERIC END
                      ELSE estimated_hours END,
    updated_at = now()
  WHERE id = found_task.id
  RETURNING * INTO updated_task;

  -- Process subtask updates if provided
  IF task_updates ? 'subtasks' AND jsonb_typeof(task_updates->'subtasks') = 'array' THEN
    -- Handle subtask updates, deletions, and insertions
    FOR i IN 0..jsonb_array_length(task_updates->'subtasks') - 1 LOOP
      DECLARE
        subtask_data JSONB := task_updates->'subtasks'->i;
        subtask_id UUID;
        subtask_exists BOOLEAN;
      BEGIN
        IF subtask_data ? 'id' AND subtask_data->>'id' != 'new' THEN
          subtask_id := (subtask_data->>'id')::UUID;
          
          -- Check if subtask exists and belongs to this task
          SELECT EXISTS(
            SELECT 1 FROM subtasks 
            WHERE id = subtask_id AND task_id = found_task.id
          ) INTO subtask_exists;
          
          IF subtask_exists THEN
            -- Handle deletion
            IF subtask_data ? 'deleted' AND subtask_data->>'deleted' = 'true' THEN
              DELETE FROM subtasks WHERE id = subtask_id;
            ELSE
              -- Update existing subtask
              UPDATE subtasks
              SET
                title = CASE WHEN subtask_data ? 'title' THEN subtask_data->>'title' ELSE title END,
                description = CASE WHEN subtask_data ? 'description' THEN subtask_data->>'description' ELSE description END,
                status = CASE 
                          WHEN subtask_data ? 'status' AND 
                               subtask_data->>'status' IN ('draft', 'backlog', 'todo', 'in_progress', 'in_review', 'completed') 
                          THEN (subtask_data->>'status')::task_status
                          ELSE status 
                        END,
                updated_at = now()
              WHERE id = subtask_id;
            END IF;
          END IF;
        ELSIF subtask_data ? 'title' AND (subtask_data->>'title') != '' THEN
          -- Create new subtask if it has a title
          INSERT INTO subtasks (
            task_id,
            title,
            description,
            status
          ) VALUES (
            found_task.id,
            subtask_data->>'title',
            COALESCE(subtask_data->>'description', ''),
            COALESCE((subtask_data->>'status')::task_status, 'todo')
          );
        END IF;
      END;
    END LOOP;
  END IF;

  -- Prepare the result with task and subtasks
  SELECT 
    jsonb_build_object(
      'task', row_to_json(t),
      'subtasks', COALESCE(jsonb_agg(row_to_json(s)) FILTER (WHERE s.id IS NOT NULL), '[]'::jsonb),
      'project', row_to_json(p)
    )::json INTO result
  FROM tasks t
  LEFT JOIN subtasks s ON t.id = s.task_id
  JOIN projects p ON t.project_id = p.id
  WHERE t.id = updated_task.id
  GROUP BY t.id, p.id;

  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_task_data(TEXT, JSONB) TO authenticated;