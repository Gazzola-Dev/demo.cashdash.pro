-- Update notifications table content_id from TEXT to UUID
-- First, add a temporary UUID column
ALTER TABLE notifications ADD COLUMN content_id_uuid UUID;

-- Migrate existing data
UPDATE notifications SET content_id_uuid = content_id::UUID WHERE content_id IS NOT NULL;

-- Drop the old column and rename the new one
ALTER TABLE notifications 
  DROP COLUMN content_id,
  ADD COLUMN content_id UUID,
  ALTER COLUMN content_id SET NOT NULL;

-- Move data from temporary column
UPDATE notifications SET content_id = content_id_uuid;

-- Drop temporary column
ALTER TABLE notifications DROP COLUMN content_id_uuid;

-- Improved delete_project_data function that properly handles all related tables
CREATE OR REPLACE FUNCTION public.delete_project_data(project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- No variable declarations needed
BEGIN
  -- No need for text conversion anymore
  -- project_id_text variable removed

  -- Delete milestone tasks associations
  DELETE FROM milestone_tasks mt
  USING milestones m
  WHERE m.project_id = delete_project_data.project_id
  AND mt.milestone_id = m.id;

  -- Delete milestone approvals
  DELETE FROM milestone_approvals ma
  USING milestones m
  WHERE m.project_id = delete_project_data.project_id
  AND ma.milestone_id = m.id;

  -- Delete milestone disputes
  DELETE FROM milestone_disputes md
  USING milestones m
  WHERE m.project_id = delete_project_data.project_id
  AND md.milestone_id = m.id;

  -- Delete contract milestones
  DELETE FROM contract_milestones cm
  USING contracts c
  WHERE c.project_id = delete_project_data.project_id
  AND cm.contract_id = c.id;

  -- Delete contracts
  DELETE FROM contracts c
  WHERE c.project_id = delete_project_data.project_id;

  -- Delete task comments
  DELETE FROM comments c
  WHERE c.content_type = 'task'
  AND c.content_id::uuid IN (
    SELECT t.id FROM tasks t WHERE t.project_id = delete_project_data.project_id
  );

  -- Delete subtasks
  DELETE FROM subtasks s
  USING tasks t
  WHERE t.project_id = delete_project_data.project_id
  AND s.task_id = t.id;

  -- Delete task schedules
  DELETE FROM task_schedule ts
  USING tasks t
  WHERE t.project_id = delete_project_data.project_id
  AND ts.task_id = t.id;

  -- Delete task tags
  DELETE FROM task_tags tt
  USING tasks t
  WHERE t.project_id = delete_project_data.project_id
  AND tt.task_id = t.id;

  -- Delete tasks
  DELETE FROM tasks t
  WHERE t.project_id = delete_project_data.project_id;

  -- Delete milestones
  DELETE FROM milestones m
  WHERE m.project_id = delete_project_data.project_id;

  -- Delete project metrics
  DELETE FROM project_metrics pm
  WHERE pm.project_id = delete_project_data.project_id;

  -- Delete external integrations
  DELETE FROM external_integrations ei
  WHERE ei.project_id = delete_project_data.project_id;

  -- Delete project subscriptions
  DELETE FROM project_subscriptions ps
  WHERE ps.project_id = delete_project_data.project_id;

  -- Delete project invitations
  DELETE FROM project_invitations pi
  WHERE pi.project_id = delete_project_data.project_id;

  -- Delete project members
  DELETE FROM project_members pm
  WHERE pm.project_id = delete_project_data.project_id;

  -- Update profiles that have this project as their current project
  UPDATE profiles p
  SET current_project_id = NULL
  WHERE p.current_project_id = delete_project_data.project_id;

  -- Delete project notifications for this project
  DELETE FROM notifications n
  WHERE n.content_type = 'project'
  AND n.content_id = delete_project_data.project_id;

  -- Finally delete the project itself
  DELETE FROM projects p
  WHERE p.id = delete_project_data.project_id;
END;
$$;

-- Create a server-side RPC function to safely delete projects
CREATE OR REPLACE FUNCTION public.delete_project(p_project_id UUID, p_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_owner BOOLEAN;
BEGIN
  -- Check if the user is the owner of the project
  SELECT EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = p_project_id
    AND pm.user_id = p_user_id
    AND pm.role = 'owner'
  ) INTO v_is_owner;

  -- If not the owner, return false
  IF NOT v_is_owner THEN
    RETURN false;
  END IF;

  -- Delete the project data
  PERFORM delete_project_data(p_project_id);
  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_project_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_project(UUID, UUID) TO authenticated;