-- Add function to delete project invitation with security checks
CREATE OR REPLACE FUNCTION public.delete_project_invitation(
  p_invitation_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_is_admin BOOLEAN;
  v_invitation project_invitations;
BEGIN
  -- First check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
    AND role = 'admin'
  ) INTO v_user_is_admin;

  IF NOT v_user_is_admin THEN
    RAISE EXCEPTION 'Only administrators can delete invitations';
  END IF;

  -- Get the invitation to verify it exists
  SELECT * INTO v_invitation
  FROM project_invitations
  WHERE id = p_invitation_id;

  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  -- Delete the invitation
  DELETE FROM project_invitations
  WHERE id = p_invitation_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_project_invitation(UUID, UUID) TO authenticated;