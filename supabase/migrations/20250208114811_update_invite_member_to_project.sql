-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.invite_member_to_project(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ);

-- Create function to handle project invitations with comprehensive checks
CREATE OR REPLACE FUNCTION public.invite_member_to_project(
  p_project_id UUID,
  p_inviter_id UUID,
  p_email TEXT,
  p_role TEXT,
  p_expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_inviter_is_admin BOOLEAN;
  v_existing_invitation project_invitations;
BEGIN
  -- Check if inviter is admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_inviter_id
    AND role = 'admin'
  ) INTO v_inviter_is_admin;

  IF NOT v_inviter_is_admin THEN
    RAISE EXCEPTION 'Only administrators can invite members';
  END IF;

  -- TODO: Add project-level permission check
  -- This would check if the inviter has admin/owner role in the project
  /*
  IF NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
    AND user_id = p_inviter_id
    AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Only project admins or owners can invite members';
  END IF;
  */

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM project_members pm
    JOIN auth.users u ON u.id = pm.user_id
    WHERE u.email = p_email
    AND pm.project_id = p_project_id
  ) THEN
    RAISE EXCEPTION 'User is already a member of this project';
  END IF;

  -- Check existing invitations
  SELECT * INTO v_existing_invitation
  FROM project_invitations
  WHERE project_id = p_project_id
  AND email = p_email
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_invitation IS NOT NULL THEN
    CASE v_existing_invitation.status
      WHEN 'pending' THEN
        RAISE EXCEPTION 'User already has a pending invitation to this project';
      WHEN 'accepted' THEN
        RAISE EXCEPTION 'User has already accepted an invitation to this project';
      ELSE
        -- For 'expired' or 'declined' statuses, we'll allow a new invitation
        -- by continuing with the function execution
    END CASE;
  END IF;

  -- Create invitation
  WITH new_invitation AS (
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
    RETURNING *
  )
  SELECT json_build_object(
    'invitation', new_invitation,
    'inviter', (
      SELECT row_to_json(p.*)
      FROM profiles p
      WHERE p.id = p_inviter_id
    ),
    'project', (
      SELECT row_to_json(pr.*)
      FROM projects pr
      WHERE pr.id = p_project_id
    )
  ) INTO v_result
  FROM new_invitation;

  RETURN v_result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.invite_member_to_project(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;