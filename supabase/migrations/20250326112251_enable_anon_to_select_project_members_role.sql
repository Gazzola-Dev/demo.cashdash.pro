-- Add policy for anonymous users to view roles
CREATE POLICY "anon_can_view_roles_20250326" 
ON project_members
FOR SELECT
TO anon
USING (true);