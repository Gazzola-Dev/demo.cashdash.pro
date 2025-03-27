-- Migration to add the update_project_member function
-- This function allows project managers and admins to update project member roles

-- First, let's add the updated_at column to the project_members table if it doesn't exist
ALTER TABLE public.project_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Create the handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS
$function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Create a trigger for project_members to auto-update the updated_at column
DROP TRIGGER IF EXISTS project_members_updated_at ON public.project_members;
CREATE TRIGGER project_members_updated_at
  BEFORE UPDATE ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Check if the project_members_role_check constraint exists and modify it
DO $$
BEGIN
  -- Check if constraint exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'project_members_role_check' 
    AND conrelid = 'public.project_members'::regclass
  ) THEN
    -- Drop existing constraint
    ALTER TABLE public.project_members DROP CONSTRAINT project_members_role_check;
  END IF;
  
  -- Add updated constraint that includes 'pm' as a valid role
  ALTER TABLE public.project_members ADD CONSTRAINT project_members_role_check 
    CHECK (role IN ('owner', 'admin', 'member', 'pm'));
END
$$;

-- Function to update a project member's role
CREATE OR REPLACE FUNCTION public.update_project_member(
  p_member_id UUID,
  p_user_id UUID,
  p_role TEXT
)
RETURNS json AS
$function$
DECLARE
  v_member project_members;
  v_project_id UUID;
  v_user_role TEXT;
  v_result json;
  v_project projects;
  v_member_info json;
  v_updated_member project_members;
  v_is_global_admin BOOLEAN;
BEGIN
  -- Check if the user is a global admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'admin'
  ) INTO v_is_global_admin;
  
  -- Get the member record to update
  SELECT * INTO v_member
  FROM project_members
  WHERE id = p_member_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project member with ID % not found', p_member_id;
  END IF;
  
  v_project_id := v_member.project_id;
  
  -- Skip permission checks for global admins
  IF NOT v_is_global_admin THEN
    -- Check if the requesting user is part of the project
    SELECT role INTO v_user_role
    FROM project_members
    WHERE project_id = v_project_id
    AND user_id = p_user_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'User is not a member of this project';
    END IF;
    
    -- Only owners, admins, and project managers can update roles
    IF v_user_role NOT IN ('owner', 'admin', 'pm') THEN
      RAISE EXCEPTION 'Insufficient permissions to update project members';
    END IF;
    
    -- Owners cannot have their role changed by anyone except themselves
    IF v_member.role = 'owner' AND v_member.user_id <> p_user_id THEN
      RAISE EXCEPTION 'Cannot change the role of the project owner';
    END IF;
    
    -- Users cannot change their own role to owner
    IF v_member.user_id = p_user_id AND p_role = 'owner' AND v_member.role <> 'owner' THEN
      RAISE EXCEPTION 'Cannot promote yourself to owner';
    END IF;
    
    -- Only owners and admins can create other admins
    IF p_role = 'admin' AND v_user_role NOT IN ('owner', 'admin') THEN
      RAISE EXCEPTION 'Only owners and admins can assign admin role';
    END IF;
  END IF;
  
  -- Validate that the role is allowed
  IF p_role NOT IN ('owner', 'admin', 'member', 'pm') THEN
    RAISE EXCEPTION 'Invalid role: %. Allowed roles are: owner, admin, member, pm', p_role;
  END IF;
  
  -- Get project info
  SELECT * INTO v_project
  FROM projects
  WHERE id = v_project_id;
  
  -- Update member role
  UPDATE project_members
  SET role = p_role
  WHERE id = p_member_id
  RETURNING * INTO v_updated_member;
  
  -- Get updated member with profile info for response
  SELECT
    jsonb_build_object(
      'member', row_to_json(v_updated_member),
      'profile', (
        SELECT row_to_json(p.*)
        FROM profiles p
        WHERE p.id = v_updated_member.user_id
      ),
      'project', row_to_json(v_project)
    ) INTO v_result;
  
  -- Log the activity
  INSERT INTO activity_log (
    action,
    actor_id,
    entity_id,
    entity_type,
    metadata
  ) VALUES (
    'update_project_member',
    p_user_id,
    p_member_id,
    'project_member',
    jsonb_build_object(
      'project_id', v_project_id,
      'old_role', v_member.role,
      'new_role', p_role
    )
  );
  
  RETURN v_result;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.update_project_member(UUID, UUID, TEXT) TO authenticated;

-- Drop existing policies for project_members
DROP POLICY IF EXISTS "Allow update by project managers, admins and owners" ON project_members;
DROP POLICY IF EXISTS "admin_manage_project_members" ON project_members;

-- Create new policy to allow project members to be updated by users with appropriate roles
CREATE POLICY "Allow update by project managers, admins and owners"
ON project_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('owner', 'admin', 'pm')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('owner', 'admin', 'pm')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- Create comprehensive policy for all operations on project_members
CREATE POLICY "admin_manage_project_members"
ON project_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members admin_pm
    WHERE admin_pm.project_id = project_members.project_id
    AND admin_pm.user_id = auth.uid()
    AND admin_pm.role IN ('owner', 'admin')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- Create a function to check if a user is a global admin
-- This can be used in other functions as needed
CREATE OR REPLACE FUNCTION public.is_global_admin(user_id UUID)
RETURNS BOOLEAN AS
$function$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = is_global_admin.user_id 
    AND role = 'admin'
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$function$
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_global_admin(UUID) TO authenticated;