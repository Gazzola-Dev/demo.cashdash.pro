-- Migration to fix the handle_invitation_response function
-- First, drop the existing function to replace it
DROP FUNCTION IF EXISTS public.handle_invitation_response;

-- Create the simplified function (notification logic removed)
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
  
  IF v_project IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  
  -- Check if the user is authorized (matches the invited email)
  DECLARE
    v_user_email TEXT;
  BEGIN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = p_user_id;
    
    IF v_user_email != v_invitation.email THEN
      RAISE EXCEPTION 'User is not authorized to respond to this invitation';
    END IF;
  END;
  
  -- Handle the response
  IF p_accept THEN
    -- Accept invitation
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
    
    -- Return success response
    SELECT json_build_object(
      'success', true,
      'message', 'Invitation accepted',
      'project', row_to_json(v_project)
    ) INTO v_result;
  ELSE
    -- Decline invitation
    UPDATE project_invitations
    SET status = 'declined'
    WHERE id = p_invitation_id;
    
    -- Return success response
    SELECT json_build_object(
      'success', true,
      'message', 'Invitation declined'
    ) INTO v_result;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_invitation_response(UUID, UUID, BOOLEAN) TO authenticated;