-- Fix the invite_member_to_project function to ensure it always returns a properly formatted JSON response
CREATE OR REPLACE FUNCTION public.invite_member_to_project(
  p_project_id UUID,
  p_inviter_id UUID,
  p_email TEXT,
  p_role TEXT DEFAULT 'member',
  p_expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
  v_project projects;
  v_user_exists boolean;
  v_invitation_exists boolean;
  v_is_member boolean;
  v_invitation project_invitations;
BEGIN
  -- Check if the project exists
  SELECT * INTO v_project FROM projects WHERE id = p_project_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Check if the inviter has permissions to invite (must be admin or owner)
  IF NOT EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = p_project_id 
    AND user_id = p_inviter_id
    AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'You do not have permission to invite members to this project';
  END IF;

  -- Check if email is valid
  IF p_email !~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Check if user with this email already exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  ) INTO v_user_exists;

  -- Check if this email is already invited to this project
  SELECT EXISTS (
    SELECT 1 FROM project_invitations 
    WHERE project_id = p_project_id 
    AND email = p_email
    AND status = 'pending'
  ) INTO v_invitation_exists;

  IF v_invitation_exists THEN
    RAISE EXCEPTION 'This email has already been invited to this project';
  END IF;

  -- Check if user is already a member (if they exist)
  IF v_user_exists THEN
    SELECT EXISTS (
      SELECT 1 FROM project_members pm
      JOIN auth.users u ON pm.user_id = u.id
      WHERE pm.project_id = p_project_id 
      AND u.email = p_email
    ) INTO v_is_member;

    IF v_is_member THEN
      RAISE EXCEPTION 'This user is already a member of this project';
    END IF;
  END IF;

  -- Create invitation
  INSERT INTO project_invitations (
    project_id,
    email,
    role,
    invited_by,
    expires_at,
    status
  )
  VALUES (
    p_project_id,
    p_email,
    p_role,
    p_inviter_id,
    p_expires_at,
    'pending'
  )
  RETURNING * INTO v_invitation;

  -- Construct result JSON explicitly (not using WITH clause)
  SELECT json_build_object(
    'invitation', row_to_json(v_invitation),
    'inviter', (
      SELECT row_to_json(p)
      FROM profiles p
      WHERE p.id = p_inviter_id
    ),
    'project', row_to_json(v_project)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Ensure execution permissions are granted
GRANT EXECUTE ON FUNCTION public.invite_member_to_project(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;