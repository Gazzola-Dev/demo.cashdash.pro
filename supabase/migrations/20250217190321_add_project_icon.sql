-- Add icon and color columns to projects table
ALTER TABLE public.projects
ADD COLUMN icon_name text,
ADD COLUMN icon_color_fg text,
ADD COLUMN icon_color_bg text;

-- Update existing RLS policies to include new columns
DROP POLICY IF EXISTS "Enable read access for project members" ON public.projects;
CREATE POLICY "Enable read access for project members" 
ON public.projects
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_members.project_id = id 
        AND project_members.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.projects;
CREATE POLICY "Enable insert for authenticated users"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for project admins and owners" ON public.projects;
CREATE POLICY "Enable update for project admins and owners" 
ON public.projects
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_members.project_id = id 
        AND project_members.user_id = auth.uid()
        AND project_members.role IN ('admin', 'owner')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_members.project_id = id 
        AND project_members.user_id = auth.uid()
        AND project_members.role IN ('admin', 'owner')
    )
);

DROP POLICY IF EXISTS "Enable delete for project owners" ON public.projects;
CREATE POLICY "Enable delete for project owners" 
ON public.projects
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_members.project_id = id 
        AND project_members.user_id = auth.uid()
        AND project_members.role = 'owner'
    )
);

-- Add comment descriptions for the new columns
COMMENT ON COLUMN public.projects.icon_name IS 'The name of the Lucide icon to render for this project';
COMMENT ON COLUMN public.projects.icon_color_fg IS 'The foreground color for the project icon (text/CSS color value)';
COMMENT ON COLUMN public.projects.icon_color_bg IS 'The background color for the project icon (text/CSS color value)';