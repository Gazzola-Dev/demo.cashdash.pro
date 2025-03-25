-- Migration to remove notifications from handle_invitation_response function
-- Problem: column "content_id" is of type uuid but expression is not matching that type
-- Solution: Remove notification functionality completely

-- Create an updated version of the handle_invitation_response function
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
  WHERE id = p_invitation_id;
  
  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;
  
  -- Get the project
  SELECT * INTO v_project
  FROM projects
  WHERE id = v_invitation.project_id;
  
  IF p_accept THEN
    -- Update invitation status
    UPDATE project_invitations
    SET status = 'accepted'
    WHERE id = p_invitation_id;
    
    -- Create a project member
    INSERT INTO project_members (
      project_id,
      user_id,
      role
    )
    VALUES (
      v_invitation.project_id,
      p_user_id,
      v_invitation.role
    );
    
    -- Notification functionality removed
  ELSE
    -- Update invitation status
    UPDATE project_invitations
    SET status = 'declined'
    WHERE id = p_invitation_id;
    
    -- Notification functionality removed
  END IF;
  
  -- Return result
  SELECT json_build_object(
    'invitation', row_to_json(v_invitation),
    'project', row_to_json(v_project)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_invitation_response(UUID, UUID, BOOLEAN) TO authenticated;