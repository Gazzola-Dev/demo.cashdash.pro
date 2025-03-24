-- Function to get pending invitations for a user by email
CREATE OR REPLACE FUNCTION public.get_user_pending_invitations(p_email TEXT)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'invitation', pi,
      'project', p,
      'inviter', prof_i
    )::json
  FROM project_invitations pi
  JOIN projects p ON pi.project_id = p.id
  LEFT JOIN profiles prof_i ON pi.invited_by = prof_i.id
  WHERE pi.email = p_email
  AND pi.status = 'pending';
END;
$$;

-- Function to handle invitation response (accept/decline)
CREATE OR REPLACE FUNCTION public.handle_invitation_response(
  p_invitation_id UUID,
  p_user_id UUID,
  p_accept BOOLEAN
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation project_invitations;
  v_project projects;
  v_result json;
BEGIN
  -- Get the invitation
  SELECT * INTO v_invitation 
  FROM project_invitations 
  WHERE id = p_invitation_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already processed';
  END IF;
  
  -- Get the project
  SELECT * INTO v_project
  FROM projects
  WHERE id = v_invitation.project_id;
  
  IF p_accept THEN
    -- Add user to project members
    INSERT INTO project_members (
      project_id,
      user_id,
      role,
      created_at
    ) VALUES (
      v_invitation.project_id,
      p_user_id,
      v_invitation.role,
      NOW()
    )
    ON CONFLICT (project_id, user_id) 
    DO UPDATE SET 
      role = v_invitation.role,
      created_at = NOW();
      
    -- Update user's current_project_id
    UPDATE profiles
    SET current_project_id = v_invitation.project_id
    WHERE id = p_user_id;
    
    -- Mark invitation as accepted
    UPDATE project_invitations
    SET status = 'accepted'
    WHERE id = p_invitation_id;
    
    -- Create a notification for the inviter
    PERFORM create_notification(
      v_invitation.invited_by,
      v_invitation.project_id::text,
      'project'::content_type,
      'Your invitation to ' || v_invitation.email || ' was accepted',
      '/' || v_project.slug
    );
  ELSE
    -- Mark invitation as declined
    UPDATE project_invitations
    SET status = 'declined'
    WHERE id = p_invitation_id;
    
    -- Create a notification for the inviter
    PERFORM create_notification(
      v_invitation.invited_by,
      v_invitation.project_id::text,
      'project'::content_type,
      'Your invitation to ' || v_invitation.email || ' was declined',
      '/' || v_project.slug
    );
  END IF;
  
  -- Return the updated invitation with project data
  SELECT 
    jsonb_build_object(
      'invitation', pi,
      'project', p,
      'success', true
    )::json INTO v_result
  FROM project_invitations pi
  JOIN projects p ON pi.project_id = p.id
  WHERE pi.id = p_invitation_id;
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_pending_invitations(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_invitation_response(UUID, UUID, BOOLEAN) TO authenticated;

-- Create a function to listen for invitations by email
CREATE OR REPLACE FUNCTION public.get_invitation_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM pg_notify(
    'invitation_change',
    json_build_object(
      'operation', TG_OP,
      'record', row_to_json(NEW)
    )::text
  );
  RETURN NEW;
END;
$$;

-- Create trigger for invitation changes
DROP TRIGGER IF EXISTS invitation_change_trigger ON project_invitations;
CREATE TRIGGER invitation_change_trigger
AFTER INSERT OR UPDATE ON project_invitations
FOR EACH ROW
EXECUTE FUNCTION public.get_invitation_changes();