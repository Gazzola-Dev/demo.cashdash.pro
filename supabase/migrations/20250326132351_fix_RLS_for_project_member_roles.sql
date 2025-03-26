-- First, drop the recursive policy that's causing issues
DROP POLICY IF EXISTS "Enable read access for project members on project_members" ON public.project_members;

-- Allow anyone to read project_members (no RLS restriction for SELECT)
CREATE POLICY "Allow anyone to read project_members"
ON public.project_members
FOR SELECT
TO public
USING (true);

-- Update the admin policy to use role_permissions instead of checking project_members recursively
DROP POLICY IF EXISTS "admin_manage_project_members" ON public.project_members;

-- New policy allowing global admins to manage project members
CREATE POLICY "global_admin_manage_project_members"
ON public.project_members
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
);

-- Also create a policy allowing project owners to manage their own project members
CREATE POLICY "project_owner_manage_members"
ON public.project_members
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'owner'
    )
);

-- Allow project managers to view and update (but not delete) project members
CREATE POLICY "project_manager_update_members"
ON public.project_members
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'pm'
    )
);