-- Enable RLS on subtasks table
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to create subtasks if they have access to the parent task
CREATE POLICY "Allow authenticated users to create subtasks"
ON public.subtasks
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM tasks t
        INNER JOIN project_members pm ON t.project_id = pm.project_id
        WHERE t.id = subtasks.task_id
        AND pm.user_id = auth.uid()
    )
);

-- Create policy to allow authenticated users to read subtasks if they have access to the parent task
CREATE POLICY "Allow authenticated users to read subtasks"
ON public.subtasks
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tasks t
        INNER JOIN project_members pm ON t.project_id = pm.project_id
        WHERE t.id = task_id
        AND pm.user_id = auth.uid()
    )
);

-- Create policy to allow authenticated users to update subtasks if they have access to the parent task
CREATE POLICY "Allow authenticated users to update subtasks"
ON public.subtasks
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tasks t
        INNER JOIN project_members pm ON t.project_id = pm.project_id
        WHERE t.id = task_id
        AND pm.user_id = auth.uid()
    )
);

-- Create policy to allow authenticated users to delete subtasks if they have access to the parent task
CREATE POLICY "Allow authenticated users to delete subtasks"
ON public.subtasks
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tasks t
        INNER JOIN project_members pm ON t.project_id = pm.project_id
        WHERE t.id = task_id
        AND pm.user_id = auth.uid()
    )
);