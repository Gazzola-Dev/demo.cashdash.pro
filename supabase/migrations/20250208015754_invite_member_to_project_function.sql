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
  v_profile_id UUID;
  v_existing_member BOOLEAN;
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

  -- Get or create profile
  WITH profile_creation AS (
    INSERT INTO profiles (id, email, invited)
    SELECT id, email, true
    FROM auth.users
    WHERE email = p_email
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE email = p_email
    )
    RETURNING id
  )
  SELECT id INTO v_profile_id
  FROM (
    SELECT id FROM profiles WHERE email = p_email
    UNION ALL
    SELECT id FROM profile_creation
  ) combined_profiles
  LIMIT 1;

  -- Check if already a member
  SELECT EXISTS (
    SELECT 1 FROM project_members pm
    JOIN profiles p ON p.id = pm.user_id
    WHERE p.email = p_email
    AND pm.project_id = p_project_id
  ) INTO v_existing_member;

  IF v_existing_member THEN
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

-- Update trigger function to handle profile invited status
CREATE OR REPLACE FUNCTION public.update_profile_invited_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
  v_has_invitations BOOLEAN;
  v_has_memberships BOOLEAN;
  v_should_be_invited BOOLEAN;
BEGIN
  -- For project_invitations table triggers
  IF TG_TABLE_NAME = 'project_invitations' THEN
    -- Get profile ID by email
    SELECT id INTO v_profile_id
    FROM profiles
    WHERE email = COALESCE(NEW.email, OLD.email);
  
  -- For project_members table triggers
  ELSIF TG_TABLE_NAME = 'project_members' THEN
    v_profile_id := COALESCE(NEW.user_id, OLD.user_id);
  END IF;

  -- Only proceed if we found a profile
  IF v_profile_id IS NOT NULL THEN
    -- Check for any pending invitations
    SELECT EXISTS (
      SELECT 1 
      FROM project_invitations pi
      JOIN profiles p ON p.email = pi.email
      WHERE p.id = v_profile_id
      AND pi.status = 'pending'
    ) INTO v_has_invitations;

    -- Check for any active memberships
    SELECT EXISTS (
      SELECT 1 
      FROM project_members 
      WHERE user_id = v_profile_id
    ) INTO v_has_memberships;

    -- Determine if profile should be marked as invited
    v_should_be_invited := v_has_invitations OR v_has_memberships;

    -- Update profile if invited status needs to change
    UPDATE profiles 
    SET invited = v_should_be_invited
    WHERE id = v_profile_id
    AND invited IS DISTINCT FROM v_should_be_invited;
  END IF;

  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Create or replace triggers for both tables
DROP TRIGGER IF EXISTS project_invitation_invited_status_trigger ON project_invitations;
CREATE TRIGGER project_invitation_invited_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON project_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_invited_status();

DROP TRIGGER IF EXISTS project_member_invited_status_trigger ON project_members;
CREATE TRIGGER project_member_invited_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_invited_status();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.invite_member_to_project(UUID, UUID, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile_invited_status() TO authenticated;