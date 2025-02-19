-- Add new columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN ordinal_priority INTEGER,
ADD COLUMN estimated_minutes INTEGER DEFAULT 0,
ADD COLUMN recorded_minutes INTEGER DEFAULT 0;

-- Initialize ordinal_priority for all existing tasks based on current priority
WITH priority_ranks AS (
  SELECT 
    id,
    project_id,
    CASE 
      WHEN status IN ('draft', 'backlog', 'completed') THEN 2147483647 -- Max INT value for lowest priority
      WHEN priority = 'urgent' THEN 1
      WHEN priority = 'high' THEN 2
      WHEN priority = 'medium' THEN 3
      WHEN priority = 'low' THEN 4
      ELSE 5
    END as initial_rank,
    ROW_NUMBER() OVER (
      PARTITION BY project_id 
      ORDER BY 
        CASE 
          WHEN status IN ('draft', 'backlog', 'completed') THEN 2147483647
          WHEN priority = 'urgent' THEN 1
          WHEN priority = 'high' THEN 2
          WHEN priority = 'medium' THEN 3
          WHEN priority = 'low' THEN 4
          ELSE 5
        END,
        created_at
    ) as row_num
  FROM tasks
)
UPDATE tasks t
SET ordinal_priority = pr.row_num
FROM priority_ranks pr
WHERE t.id = pr.id;

-- Function to handle task priority changes
CREATE OR REPLACE FUNCTION public.update_task_priority(
  p_task_id UUID,
  p_new_priority task_priority,
  p_new_ordinal_priority INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_current_status task_status;
  v_current_ordinal INTEGER;
  v_max_ordinal INTEGER;
BEGIN
  -- Get task's current project and status
  SELECT project_id, status, ordinal_priority
  INTO v_project_id, v_current_status, v_current_ordinal
  FROM tasks
  WHERE id = p_task_id;

  -- If task is in draft, backlog, or completed, set to lowest priority
  IF v_current_status IN ('draft', 'backlog', 'completed') THEN
    UPDATE tasks
    SET 
      priority = p_new_priority,
      ordinal_priority = 2147483647
    WHERE id = p_task_id;
    RETURN;
  END IF;

  -- Get maximum ordinal priority for the project
  SELECT COALESCE(MAX(ordinal_priority), 0)
  INTO v_max_ordinal
  FROM tasks
  WHERE project_id = v_project_id
  AND status NOT IN ('draft', 'backlog', 'completed');

  -- If no specific ordinal priority provided, add to end of priority group
  IF p_new_ordinal_priority IS NULL THEN
    UPDATE tasks
    SET 
      priority = p_new_priority,
      ordinal_priority = v_max_ordinal + 1
    WHERE id = p_task_id;
    RETURN;
  END IF;

  -- Shift existing tasks to make room for the new position
  UPDATE tasks
  SET ordinal_priority = ordinal_priority + 1
  WHERE project_id = v_project_id
  AND ordinal_priority >= p_new_ordinal_priority
  AND id != p_task_id;

  -- Update the task's priority and ordinal position
  UPDATE tasks
  SET 
    priority = p_new_priority,
    ordinal_priority = p_new_ordinal_priority
  WHERE id = p_task_id;
END;
$$;

-- Add a trigger to maintain ordinal priority when status changes
CREATE OR REPLACE FUNCTION public.handle_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If moving to draft, backlog, or completed, set to lowest priority
  IF NEW.status IN ('draft', 'backlog', 'completed') THEN
    NEW.ordinal_priority := 2147483647;
  -- If moving from draft, backlog, or completed to active status, set to end of list
  ELSIF OLD.status IN ('draft', 'backlog', 'completed') AND 
        NEW.status NOT IN ('draft', 'backlog', 'completed') THEN
    SELECT COALESCE(MAX(ordinal_priority), 0) + 1
    INTO NEW.ordinal_priority
    FROM tasks
    WHERE project_id = NEW.project_id
    AND status NOT IN ('draft', 'backlog', 'completed');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_task_status_change
    BEFORE UPDATE OF status ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION handle_task_status_change();

-- Add NOT NULL constraint after initialization
ALTER TABLE public.tasks 
ALTER COLUMN ordinal_priority SET NOT NULL;