-- Function to handle invitation acceptance or decline
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
  v_result json;
BEGIN
  -- Get the invitation
  SELECT * INTO v_invitation
  FROM project_invitations
  WHERE id = p_invitation_id;

  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  -- Verify user email matches invitation
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
    AND email = v_invitation.email
  ) THEN
    RAISE EXCEPTION 'User email does not match invitation';
  END IF;

  -- Check if invitation is still pending
  IF v_invitation.status != 'pending' THEN
    RAISE EXCEPTION 'Invitation is no longer pending';
  END IF;

  -- Check if invitation has expired
  IF v_invitation.expires_at < now() THEN
    UPDATE project_invitations
    SET status = 'expired'
    WHERE id = p_invitation_id;
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  -- Handle acceptance or decline
  IF p_accept THEN
    -- Add user to project members
    INSERT INTO project_members (
      project_id,
      user_id,
      role
    ) VALUES (
      v_invitation.project_id,
      p_user_id,
      v_invitation.role
    );

    -- Update invitation status
    UPDATE project_invitations
    SET status = 'accepted'
    WHERE id = p_invitation_id;
  ELSE
    -- Update invitation status to declined
    UPDATE project_invitations
    SET status = 'declined'
    WHERE id = p_invitation_id;
  END IF;

  -- Return updated invitation data with project details
  SELECT json_build_object(
    'invitation', row_to_json(pi.*),
    'project', row_to_json(p.*),
    'inviter', row_to_json(prof.*)
  ) INTO v_result
  FROM project_invitations pi
  INNER JOIN projects p ON pi.project_id = p.id
  LEFT JOIN profiles prof ON pi.invited_by = prof.id
  WHERE pi.id = p_invitation_id;

  RETURN v_result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_invitation_response(UUID, UUID, BOOLEAN) TO authenticated;