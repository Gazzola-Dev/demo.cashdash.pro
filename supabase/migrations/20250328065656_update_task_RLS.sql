-- Migration for task management functions with proper RLS enforcement
-- This migration creates or replaces all necessary functions to handle task-related operations

-- Function to check if a user is a global admin
CREATE OR REPLACE FUNCTION public.is_user_global_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
    AND role = 'admin'
  );
END;
$$;

-- Function to check if a user is a project manager for a project
CREATE OR REPLACE FUNCTION public.is_user_project_manager(p_user_id UUID, p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE user_id = p_user_id
    AND project_id = p_project_id
    AND role IN ('owner', 'admin', 'pm')
  );
END;
$$;

-- Function to check if a milestone is in draft status
CREATE OR REPLACE FUNCTION public.is_milestone_draft(p_milestone_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status milestone_status;
BEGIN
  SELECT status INTO v_status
  FROM milestones
  WHERE id = p_milestone_id;
  
  RETURN v_status = 'draft';
END;
$$;

-- Function to check if a milestone is active
CREATE OR REPLACE FUNCTION public.is_milestone_active(p_milestone_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status milestone_status;
BEGIN
  SELECT status INTO v_status
  FROM milestones
  WHERE id = p_milestone_id;
  
  RETURN v_status = 'active';
END;
$$;

-- Function to check if a task is assigned to a user
CREATE OR REPLACE FUNCTION public.is_task_assigned_to_user(p_task_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tasks
    WHERE id = p_task_id
    AND assignee = p_user_id
  );
END;
$$;

-- Function to check if a user has permission to update a task
CREATE OR REPLACE FUNCTION public.can_user_update_task(
  p_user_id UUID,
  p_task_id UUID,
  p_updates JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_milestone_id UUID;
  v_is_admin BOOLEAN;
  v_is_project_manager BOOLEAN;
  v_is_draft_milestone BOOLEAN;
  v_is_active_milestone BOOLEAN;
  v_is_assignee BOOLEAN;
  v_only_status_update BOOLEAN;
BEGIN
  -- Get related project and milestone information
  SELECT t.project_id, mt.milestone_id INTO v_project_id, v_milestone_id
  FROM tasks t
  LEFT JOIN milestone_tasks mt ON t.id = mt.task_id
  WHERE t.id = p_task_id;
  
  -- Check if user is a global admin
  v_is_admin := is_user_global_admin(p_user_id);
  IF v_is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a project manager
  v_is_project_manager := is_user_project_manager(p_user_id, v_project_id);
  
  -- If there's a milestone, check its status
  IF v_milestone_id IS NOT NULL THEN
    v_is_draft_milestone := is_milestone_draft(v_milestone_id);
    v_is_active_milestone := is_milestone_active(v_milestone_id);
  END IF;
  
  -- Check if user is the assignee
  v_is_assignee := is_task_assigned_to_user(p_task_id, p_user_id);
  
  -- Check if only the status is being updated
  v_only_status_update := (jsonb_object_keys(p_updates) = ARRAY['status']::text[]);
  
  -- Rule 1: Project managers can do anything to tasks in draft milestones
  IF v_is_project_manager AND (v_milestone_id IS NULL OR v_is_draft_milestone) THEN
    RETURN TRUE;
  END IF;
  
  -- Rule 2: Project managers can change status, assignee, or priority of tasks in active milestones
  IF v_is_project_manager AND v_is_active_milestone AND (
    p_updates ? 'status' OR 
    p_updates ? 'assignee' OR 
    p_updates ? 'priority' OR
    p_updates ? 'ordinal_priority'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Rule 3: Task assignees can update the status of their assigned tasks
  IF v_is_assignee AND v_only_status_update THEN
    RETURN TRUE;
  END IF;
  
  -- If none of the conditions are met, deny permission
  RETURN FALSE;
END;
$$;

-- First, drop the existing function to avoid return type error
DROP FUNCTION IF EXISTS public.update_task_data(UUID, JSONB);

-- Function to update a task with RLS enforcement
CREATE FUNCTION public.update_task_data(
  task_id UUID,
  task_updates JSONB
)
RETURNS JSON -- Using JSON type to maintain compatibility with existing code
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  found_task tasks;
  result JSON;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if the user has permission to update this task
  IF NOT can_user_update_task(v_user_id, task_id, task_updates) THEN
    RAISE EXCEPTION 'You do not have permission to update this task';
  END IF;
  
  -- Find the task
  SELECT * INTO found_task
  FROM tasks
  WHERE id = task_id;
  
  IF found_task.id IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;
  
  -- Perform the update
  UPDATE tasks
  SET
    title = COALESCE(task_updates->>'title', title),
    description = COALESCE(task_updates->>'description', description),
    status = COALESCE((task_updates->>'status')::task_status, status),
    priority = COALESCE((task_updates->>'priority')::task_priority, priority),
    ordinal_priority = COALESCE((task_updates->>'ordinal_priority')::int, ordinal_priority),
    assignee = CASE 
      WHEN task_updates->>'assignee' = 'null' THEN NULL 
      WHEN task_updates ? 'assignee' THEN (task_updates->>'assignee')::uuid 
      ELSE assignee 
    END,
    budget_cents = CASE 
      WHEN task_updates->>'budget_cents' = 'null' THEN NULL 
      WHEN task_updates ? 'budget_cents' THEN (task_updates->>'budget_cents')::int 
      ELSE budget_cents 
    END,
    estimated_minutes = CASE 
      WHEN task_updates->>'estimated_minutes' = 'null' THEN NULL 
      WHEN task_updates ? 'estimated_minutes' THEN (task_updates->>'estimated_minutes')::int 
      ELSE estimated_minutes 
    END,
    updated_at = now()
  WHERE id = task_id
  RETURNING to_json(tasks.*) INTO result;
  
  -- Return the updated task data with assignee profile information
  RETURN result;
END;
$$;

-- Function for updating multiple tasks' ordinal priority with RLS enforcement
DROP FUNCTION IF EXISTS public.update_tasks_order(UUID[], INT[]);

CREATE FUNCTION public.update_tasks_order(
  p_task_ids UUID[],
  p_priorities INT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_task_id UUID;
  v_project_id UUID;
  v_milestone_id UUID;
  v_is_admin BOOLEAN;
  v_is_project_manager BOOLEAN;
  i INT;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if arrays have the same length
  IF array_length(p_task_ids, 1) != array_length(p_priorities, 1) THEN
    RAISE EXCEPTION 'Task IDs and priorities arrays must have the same length';
  END IF;
  
  -- Check if user is a global admin
  v_is_admin := is_user_global_admin(v_user_id);
  
  IF NOT v_is_admin THEN
    -- Get the project ID of the first task to verify permissions
    -- We assume all tasks belong to the same project
    SELECT t.project_id, mt.milestone_id INTO v_project_id, v_milestone_id
    FROM tasks t
    LEFT JOIN milestone_tasks mt ON t.id = mt.task_id
    WHERE t.id = p_task_ids[1];
    
    -- Check if user is a project manager
    v_is_project_manager := is_user_project_manager(v_user_id, v_project_id);
    
    IF NOT v_is_project_manager THEN
      RAISE EXCEPTION 'You do not have permission to reorder tasks';
    END IF;
    
    -- For active milestones, verify that all tasks being updated are in the same milestone
    IF v_milestone_id IS NOT NULL AND NOT is_milestone_draft(v_milestone_id) THEN
      FOR i IN 1..array_length(p_task_ids, 1) LOOP
        SELECT mt.milestone_id INTO v_milestone_id
        FROM milestone_tasks mt
        WHERE mt.task_id = p_task_ids[i];
        
        IF v_milestone_id IS NOT NULL AND NOT is_milestone_draft(v_milestone_id) THEN
          IF NOT is_user_project_manager(v_user_id, v_project_id) THEN
            RAISE EXCEPTION 'You do not have permission to reorder tasks in an active milestone';
          END IF;
        END IF;
      END LOOP;
    END IF;
  END IF;
  
  -- Update each task's ordinal priority
  FOR i IN 1..array_length(p_task_ids, 1) LOOP
    UPDATE tasks
    SET ordinal_priority = p_priorities[i],
        updated_at = now()
    WHERE id = p_task_ids[i];
  END LOOP;
  
  RETURN TRUE;
END;
$$;

-- Function for creating a new task with RLS enforcement
DROP FUNCTION IF EXISTS public.create_task(UUID, UUID);

CREATE FUNCTION public.create_task(
  p_project_id UUID,
  p_milestone_id UUID DEFAULT NULL
)
RETURNS JSON -- Using JSON type to maintain compatibility with existing code
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_project projects;
  v_is_admin BOOLEAN;
  v_is_project_manager BOOLEAN;
  v_is_draft_milestone BOOLEAN := TRUE;
  v_next_ordinal_id INT;
  v_next_priority INT;
  v_task_slug TEXT;
  v_new_task tasks;
  result JSON;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user is a global admin
  v_is_admin := is_user_global_admin(v_user_id);
  
  -- Check if user is a project manager
  v_is_project_manager := is_user_project_manager(v_user_id, p_project_id);
  
  -- If milestone is provided, check if it's in draft status
  IF p_milestone_id IS NOT NULL THEN
    v_is_draft_milestone := is_milestone_draft(p_milestone_id);
  END IF;
  
  -- Verify permissions: must be admin or project manager (and milestone must be draft if specified)
  IF NOT (v_is_admin OR (v_is_project_manager AND v_is_draft_milestone)) THEN
    RAISE EXCEPTION 'You do not have permission to create tasks';
  END IF;
  
  -- Get project info
  SELECT * INTO v_project
  FROM projects
  WHERE id = p_project_id;
  
  IF v_project.id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  
  -- Calculate next ordinal ID
  SELECT COALESCE(MAX(ordinal_id), 0) + 1 INTO v_next_ordinal_id
  FROM tasks
  WHERE project_id = p_project_id;
  
  -- Calculate next priority
  SELECT COALESCE(MAX(ordinal_priority), 0) + 1000 INTO v_next_priority
  FROM tasks
  WHERE project_id = p_project_id;
  
  -- Create task slug
  v_task_slug := SUBSTRING(p_project_id::text, 1, 8) || '-' || LOWER(v_project.prefix) || '-' || v_next_ordinal_id::text;
  
  -- Create the new task
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
  
  -- If milestone ID is provided, associate the task with the milestone
  IF p_milestone_id IS NOT NULL THEN
    INSERT INTO milestone_tasks (milestone_id, task_id)
    VALUES (p_milestone_id, v_new_task.id);
  END IF;
  
  -- Prepare the return value
  SELECT to_json(v_new_task) INTO result;
  
  RETURN result;
END;
$$;

-- Add permissions
GRANT EXECUTE ON FUNCTION public.update_task_data(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_tasks_order(UUID[], INT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_task(UUID, UUID) TO authenticated;