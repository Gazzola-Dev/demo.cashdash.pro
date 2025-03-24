-- Enhance get_project_invites to return ProjectInvitationWithDetails
CREATE OR REPLACE FUNCTION public.get_project_invites(p_project_id UUID)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return invitations if the user has manager level access
  IF EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin', 'pm')
  ) THEN
    RETURN QUERY
    SELECT 
      jsonb_build_object(
        'id', pi.id,
        'created_at', pi.created_at,
        'project_id', pi.project_id,
        'email', pi.email,
        'role', pi.role,
        'status', pi.status,
        'expires_at', pi.expires_at,
        'inviter', jsonb_build_object(
          'id', p.id,
          'display_name', p.display_name,
          'avatar_url', p.avatar_url,
          'email', p.email
        ),
        'project', jsonb_build_object(
          'id', proj.id,
          'name', proj.name,
          'slug', proj.slug
        )
      )::json
    FROM project_invitations pi
    INNER JOIN profiles p ON pi.invited_by = p.id
    INNER JOIN projects proj ON pi.project_id = proj.id
    WHERE pi.project_id = p_project_id;
  ELSE
    RETURN QUERY SELECT json_build_object()::json WHERE false;
  END IF;
END;
$$;

-- Update get_user_pending_invitations to return ProjectInvitationWithDetails
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
      'id', pi.id,
      'created_at', pi.created_at,
      'project_id', pi.project_id,
      'email', pi.email,
      'role', pi.role,
      'status', pi.status,
      'expires_at', pi.expires_at,
      'inviter', jsonb_build_object(
        'id', p.id,
        'display_name', p.display_name,
        'avatar_url', p.avatar_url,
        'email', p.email
      ),
      'project', jsonb_build_object(
        'id', proj.id,
        'name', proj.name,
        'slug', proj.slug
      )
    )::json
  FROM project_invitations pi
  INNER JOIN profiles p ON pi.invited_by = p.id
  INNER JOIN projects proj ON pi.project_id = proj.id
  WHERE pi.email = p_email
  AND pi.status = 'pending'
  AND pi.expires_at > NOW();
END;
$$;

-- Add policy to allow reading project invitations directly if you are the invitee
CREATE POLICY "Enable read access for invitees on project_invitations" 
ON public.project_invitations
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Enable RLS on project_invitations
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- Enable NOTIFY for invitation changes
CREATE OR REPLACE FUNCTION public.get_invitation_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_name TEXT;
  v_inviter_name TEXT;
  v_payload JSONB;
BEGIN
  -- Get project name
  SELECT name INTO v_project_name FROM projects WHERE id = NEW.project_id;
  
  -- Get inviter name
  SELECT display_name INTO v_inviter_name FROM profiles WHERE id = NEW.invited_by;
  
  -- Build a richer payload with more context
  v_payload := jsonb_build_object(
    'operation', TG_OP,
    'record', jsonb_build_object(
      'id', NEW.id,
      'project_id', NEW.project_id,
      'project_name', v_project_name,
      'email', NEW.email,
      'role', NEW.role,
      'status', NEW.status,
      'invited_by', NEW.invited_by,
      'inviter_name', v_inviter_name,
      'created_at', NEW.created_at,
      'expires_at', NEW.expires_at
    )
  );
  
  -- Send notification
  PERFORM pg_notify(
    'invitation_change',
    v_payload::text
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for invitation changes if it doesn't exist
DROP TRIGGER IF EXISTS invitation_change_trigger ON project_invitations;
CREATE TRIGGER invitation_change_trigger
AFTER INSERT OR UPDATE ON project_invitations
FOR EACH ROW
EXECUTE FUNCTION public.get_invitation_changes();