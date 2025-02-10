-- Drop existing function first
DROP FUNCTION IF EXISTS public.delete_project_data(uuid);

-- Create the improved function
CREATE OR REPLACE FUNCTION public.delete_project_data(project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete task comments
  DELETE FROM comments c
  WHERE c.content_type = 'task'
  AND c.content_id::uuid IN (
    SELECT t.id FROM tasks t WHERE t.project_id = delete_project_data.project_id
  );

  -- Delete task schedules
  DELETE FROM task_schedule ts
  WHERE ts.task_id IN (
    SELECT t.id FROM tasks t WHERE t.project_id = delete_project_data.project_id
  );

  -- Delete subtasks
  DELETE FROM subtasks s
  WHERE s.task_id IN (
    SELECT t.id FROM tasks t WHERE t.project_id = delete_project_data.project_id
  );

  -- Delete tasks
  DELETE FROM tasks t 
  WHERE t.project_id = delete_project_data.project_id;

  -- Delete project invitations
  DELETE FROM project_invitations pi 
  WHERE pi.project_id = delete_project_data.project_id;

  -- Delete project members
  DELETE FROM project_members pm 
  WHERE pm.project_id = delete_project_data.project_id;

  -- Delete external integrations
  DELETE FROM external_integrations ei 
  WHERE ei.project_id = delete_project_data.project_id;

  -- Delete project metrics
  DELETE FROM project_metrics pm 
  WHERE pm.project_id = delete_project_data.project_id;

  -- Finally delete the project
  DELETE FROM projects p 
  WHERE p.id = delete_project_data.project_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_project_data(UUID) TO authenticated;