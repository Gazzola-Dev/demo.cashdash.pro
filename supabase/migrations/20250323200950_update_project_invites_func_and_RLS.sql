-- Migration to add function to get project invites and update RLS policies
-- for project invitations and project members

-- 1. Create function to get project invites with security definer
CREATE OR REPLACE FUNCTION public.get_project_invites(p_project_id UUID)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user has permission to view invites (must be a project manager)
  IF NOT EXISTS (
    SELECT 1 
    FROM project_members 
    WHERE project_id = p_project_id 
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin', 'pm')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only project managers can view invitations';
  END IF;

  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', pi.id,
      'project_id', pi.project_id,
      'email', pi.email,
      'role', pi.role,
      'status', pi.status,
      'invited_by', pi.invited_by,
      'created_at', pi.created_at,
      'expires_at', pi.expires_at,
      'inviter', jsonb_build_object(
        'id', prof.id,
        'display_name', prof.display_name,
        'avatar_url', prof.avatar_url
      )
    )::json
  FROM project_invitations pi
  LEFT JOIN profiles prof ON pi.invited_by = prof.id
  WHERE pi.project_id = p_project_id
  ORDER BY pi.created_at DESC;
END;
$$;

-- 2. Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_project_invites(UUID) TO authenticated;

-- 3. Update RLS policy for project_invitations to restrict to project managers
-- First, drop any existing RLS policies for project_invitations that might conflict
DROP POLICY IF EXISTS "Enable read access for project members on project_invitations" ON public.project_invitations;

-- Create new policy for project_invitations (only managers can view)
CREATE POLICY "Enable read access for project managers on project_invitations" 
ON public.project_invitations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_members.project_id = project_invitations.project_id 
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('owner', 'admin', 'pm')
  )
);

-- 4. Ensure RLS is enabled for project_invitations
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- 5. Create or update policy for project_members to allow all project members to view
DROP POLICY IF EXISTS "Enable read access for project members on project_members" ON public.project_members;

CREATE POLICY "Enable read access for project members on project_members" 
ON public.project_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_members.project_id 
    AND pm.user_id = auth.uid()
  )
);

-- 6. Create additional policy for project invitations management (insert, update, delete)
-- Only project managers can manage invitations
CREATE POLICY "Enable management for project managers on project_invitations" 
ON public.project_invitations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_members.project_id = project_invitations.project_id 
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('owner', 'admin', 'pm')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_members.project_id = project_invitations.project_id 
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('owner', 'admin', 'pm')
  )
);