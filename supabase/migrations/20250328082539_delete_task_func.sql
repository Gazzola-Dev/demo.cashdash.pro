
CREATE OR REPLACE FUNCTION public.delete_task(
  p_task_id UUID,
  p_user_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_project_id UUID;
  v_is_manager BOOLEAN;
  v_is_owner BOOLEAN;
  v_is_admin BOOLEAN;
  v_is_assignee BOOLEAN;
  v_milestone_is_draft BOOLEAN := TRUE;
  v_milestone_id UUID;
BEGIN
  -- Get the project ID for the task
  SELECT project_id INTO v_task_project_id
  FROM tasks
  WHERE id = p_task_id;
  
  IF v_task_project_id IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;
  
  -- Check if task is in a milestone and get milestone status
  SELECT 
    milestone_id INTO v_milestone_id
  FROM 
    milestone_tasks
  WHERE 
    task_id = p_task_id;
    
  IF v_milestone_id IS NOT NULL THEN
    SELECT (status = 'draft') INTO v_milestone_is_draft
    FROM milestones
    WHERE id = v_milestone_id;
  END IF;

  -- Check if user is a project manager
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = v_task_project_id
    AND user_id = p_user_id
    AND role IN ('owner', 'admin', 'pm')
  ) INTO v_is_manager;
  
  -- Check if user is assignee of the task
  SELECT (assignee = p_user_id) INTO v_is_assignee
  FROM tasks
  WHERE id = p_task_id;
  
  -- Check if user is a global admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
    AND role = 'admin'
  ) INTO v_is_admin;
  
  -- Determine if user can delete the task
  -- Project managers can delete any task in a draft milestone or not in a milestone
  -- Assignees can only delete their own tasks if not in an active milestone
  -- Global admins can delete any task
  IF (v_is_manager AND (v_milestone_is_draft OR v_milestone_id IS NULL)) OR 
     v_is_admin OR 
     (v_is_assignee AND (v_milestone_is_draft OR v_milestone_id IS NULL)) THEN
    
    -- Delete related records first
    DELETE FROM comments
    WHERE content_type = 'task' AND content_id::UUID = p_task_id;
    
    DELETE FROM task_schedule
    WHERE task_id = p_task_id;
    
    DELETE FROM subtasks
    WHERE task_id = p_task_id;
    
    DELETE FROM milestone_tasks
    WHERE task_id = p_task_id;
    
    DELETE FROM task_tags
    WHERE task_id = p_task_id;
    
    -- Finally delete the task itself
    DELETE FROM tasks
    WHERE id = p_task_id;
    
    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'Permission denied to delete this task';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_task(UUID, UUID) TO authenticated;
