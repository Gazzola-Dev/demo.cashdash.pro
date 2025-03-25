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
  v_project projects;
  v_result json;
  v_already_member BOOLEAN;
  v_invitation project_invitations;
BEGIN
  -- Validate input
  IF p_project_id IS NULL OR p_inviter_id IS NULL OR p_email IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters';
  END IF;
  
  -- Check if the project exists
  SELECT * INTO v_project FROM projects WHERE id = p_project_id;
  
  IF v_project IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  
  -- Check if the user is already a member of the project
  SELECT EXISTS (
    SELECT 1 
    FROM project_members pm
    JOIN profiles p ON pm.user_id = p.id
    WHERE pm.project_id = p_project_id 
    AND p.email = p_email
  ) INTO v_already_member;
  
  IF v_already_member THEN
    RAISE EXCEPTION 'User is already a member of this project';
  END IF;
  
  -- Use UPSERT pattern with INSERT ... ON CONFLICT ... DO UPDATE
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
  ON CONFLICT (project_id, email) DO UPDATE SET
    invited_by = p_inviter_id,
    role = p_role,
    expires_at = p_expires_at,
    status = 'pending',
    created_at = NOW()
  RETURNING * INTO v_invitation;
  
  -- Create result JSON
  SELECT json_build_object(
    'invitation', row_to_json(v_invitation),
    'inviter', (
      SELECT row_to_json(p.*)
      FROM profiles p
      WHERE p.id = p_inviter_id
    ),
    'project', row_to_json(v_project)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;