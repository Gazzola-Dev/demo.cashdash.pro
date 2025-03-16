-- Create a function to create a new task
CREATE OR REPLACE FUNCTION create_task(
  p_project_id UUID,
  p_milestone_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_project record;
  v_next_ordinal_id INT;
  v_next_priority INT;
  v_task_slug TEXT;
  v_new_task record;
BEGIN
  -- Get current user ID from Supabase auth.uid()
  v_user_id := auth.uid();
  
  -- Check if the user exists and has access to the project
  PERFORM id FROM project_members 
  WHERE project_id = p_project_id 
  AND user_id = v_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'You do not have permission to create tasks in this project';
  END IF;

  -- Get project details for the prefix
  SELECT * INTO v_project FROM projects WHERE id = p_project_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Get the next ordinal_id for the project
  SELECT COALESCE(MAX(ordinal_id), 0) + 1 INTO v_next_ordinal_id 
  FROM tasks 
  WHERE project_id = p_project_id;

  -- Find the maximum ordinal_priority for tasks in the project
  SELECT COALESCE(MAX(ordinal_priority), 0) + 1 INTO v_next_priority 
  FROM tasks 
  WHERE project_id = p_project_id;

  -- Create the slug
  v_task_slug := SUBSTRING(p_project_id::text, 1, 8) || '-' || LOWER(v_project.prefix) || '-' || v_next_ordinal_id::text;

  -- Create a new task
  INSERT INTO tasks (
    title,
    description,
    project_id,
    prefix,
    slug,
    ordinal_id,
    ordinal_priority,
    status,
    priority
  ) VALUES (
    'New Task',
    '',
    p_project_id,
    v_project.prefix,
    v_task_slug,
    v_next_ordinal_id,
    v_next_priority,
    'draft',
    'medium'
  )
  RETURNING * INTO v_new_task;

  -- If a milestone ID is provided, associate the task with the milestone
  IF p_milestone_id IS NOT NULL THEN
    -- Verify the milestone exists and belongs to the project
    PERFORM id FROM milestones 
    WHERE id = p_milestone_id AND project_id = p_project_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Milestone not found or does not belong to this project';
    END IF;
    
    -- Create the association
    INSERT INTO milestone_tasks (milestone_id, task_id)
    VALUES (p_milestone_id, v_new_task.id);
  END IF;

  -- Return the new task as JSONB
  RETURN row_to_json(v_new_task)::JSONB;
END;
$$;