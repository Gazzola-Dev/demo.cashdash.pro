-- Allow users to read tasks in projects they are members of
CREATE POLICY "Allow project members to read tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
);

-- Allow project members to create tasks
CREATE POLICY "Allow project members to create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
);

-- Allow project members to update tasks
CREATE POLICY "Allow project members to update tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
);

-- Allow project owners and admins to delete tasks
CREATE POLICY "Allow project owners and admins to delete tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role IN ('owner', 'admin')
    )
);

-- Grant permissions
GRANT ALL ON public.tasks TO authenticated;