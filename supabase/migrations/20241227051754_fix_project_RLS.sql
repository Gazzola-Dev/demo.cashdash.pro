-- Corrected policies for project_members and projects

-- First drop existing policies
DROP POLICY IF EXISTS "Enable read access for project members" ON projects;
DROP POLICY IF EXISTS "Enable delete for project owners" ON projects;
DROP POLICY IF EXISTS "Enable update for project admins and owners" ON projects;
DROP POLICY IF EXISTS "Allow users to read own memberships" ON project_members;
DROP POLICY IF EXISTS "Allow project owners and admins to manage members" ON project_members;

-- Enable RLS on both tables
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create corrected policies for projects
CREATE POLICY "Enable read access for project members" 
ON projects
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_members.project_id = projects.id 
        AND project_members.user_id = auth.uid()
    )
);

CREATE POLICY "Enable delete for project owners" 
ON projects
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid() 
        AND project_members.role = 'owner'
    )
);

CREATE POLICY "Enable update for project admins and owners" 
ON projects
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid() 
        AND project_members.role = ANY (ARRAY['admin', 'owner'])
    )
);

CREATE POLICY "Enable insert for authenticated users"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policies for project_members
CREATE POLICY "Allow users to read own memberships"
ON project_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Allow project owners and admins to manage members"
ON project_members
FOR ALL
TO authenticated
USING (
    role IN ('owner', 'admin')
    AND user_id = auth.uid()
);