CREATE OR REPLACE FUNCTION public.delete_project_member(
  p_member_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_is_admin BOOLEAN;
  v_member project_members;
BEGIN
  -- First check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
    AND role = 'admin'
  ) INTO v_user_is_admin;

  IF NOT v_user_is_admin THEN
    RAISE EXCEPTION 'Only administrators can remove members';
  END IF;

  -- Get the member to verify it exists
  SELECT * INTO v_member
  FROM project_members
  WHERE id = p_member_id;

  IF v_member IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  -- Cannot remove the last owner
  IF v_member.role = 'owner' AND (
    SELECT COUNT(*) FROM project_members
    WHERE project_id = v_member.project_id
    AND role = 'owner'
  ) <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last project owner';
  END IF;

  -- Delete the member
  DELETE FROM project_members
  WHERE id = p_member_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_project_member(UUID, UUID) TO authenticated;
