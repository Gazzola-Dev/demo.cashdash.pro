-- Step 1: Drop all existing policies on project_members
-- Use IF EXISTS to prevent errors if the policy doesn't exist
DROP POLICY IF EXISTS "Allow project owners and admins to manage members" ON project_members;
DROP POLICY IF EXISTS "Allow users to read own memberships" ON project_members;
DROP POLICY IF EXISTS "Enable read access for project members on project_members" ON public.project_members;
DROP POLICY IF EXISTS "Enable delete for own memberships" ON project_members;
DROP POLICY IF EXISTS "users_can_view_project_members" ON project_members;
DROP POLICY IF EXISTS "admins_can_manage_project_members" ON project_members;
DROP POLICY IF EXISTS "user_view_own_memberships" ON project_members;
DROP POLICY IF EXISTS "user_view_project_memberships" ON project_members;
DROP POLICY IF EXISTS "admin_manage_project_members" ON project_members;
DROP POLICY IF EXISTS "user_delete_own_membership" ON project_members;

-- Step 2: Create fresh policies with unique names
-- To avoid any possibility of a conflict, use timestamp in policy names
CREATE POLICY "view_members_20250326" 
ON project_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM project_members AS pm
    WHERE pm.project_id = project_members.project_id 
    AND pm.user_id = auth.uid()
  )
);

-- Policy for insert/update/delete
CREATE POLICY "manage_members_20250326"
ON project_members
FOR ALL
TO authenticated
USING (
  (
    -- Direct check for users managing their own membership
    user_id = auth.uid()
  ) 
  OR 
  (
    -- Check for admin/owner status using a different table alias to prevent recursion
    EXISTS (
      SELECT 1 
      FROM project_members AS admin_check
      WHERE admin_check.project_id = project_members.project_id
      AND admin_check.user_id = auth.uid()
      AND admin_check.role IN ('owner', 'admin')
    )
  )
);