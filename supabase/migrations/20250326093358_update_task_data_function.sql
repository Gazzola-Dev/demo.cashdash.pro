-- Drop all existing policies on project_members to ensure we don't have conflicting policies
DROP POLICY IF EXISTS "Allow project owners and admins to manage members" ON project_members;
DROP POLICY IF EXISTS "Allow users to read own memberships" ON project_members;
DROP POLICY IF EXISTS "Enable read access for project members on project_members" ON public.project_members;
DROP POLICY IF EXISTS "Enable delete for own memberships" ON project_members;

-- Create a policy for users to select their own memberships that doesn't cause recursion
CREATE POLICY "user_view_own_memberships" 
ON project_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create a policy for users to select all memberships in projects they're a member of
-- This avoids the recursion by using a direct check on project_id and user_id
CREATE POLICY "user_view_project_memberships" 
ON project_members
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = project_members.project_id
        AND EXISTS (
            SELECT 1 FROM project_members pm 
            WHERE pm.project_id = p.id 
            AND pm.user_id = auth.uid()
        )
    )
);

-- Create a policy for project owners and admins to manage members
-- This avoids the infinite recursion by separating the permission check
-- into a subquery that doesn't reference the row being checked
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
);

-- Allow users to delete their own memberships
CREATE POLICY "user_delete_own_membership"
ON project_members
FOR DELETE
TO authenticated
USING (user_id = auth.uid());