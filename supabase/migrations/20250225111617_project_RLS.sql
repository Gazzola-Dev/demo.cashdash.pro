-- Enable insert policy for project_subscriptions
CREATE POLICY "Allow authenticated users to insert project subscriptions for their projects" 
ON public.project_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
    project_id IS NULL OR EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_members.project_id = project_subscriptions.project_id 
        AND project_members.user_id = auth.uid()
    )
);

-- Drop the existing index if it exists
DROP INDEX IF EXISTS idx_unique_project_subscription;

-- Create a unique index that only includes non-null project_ids
CREATE UNIQUE INDEX idx_unique_project_subscription 
ON public.project_subscriptions (project_id)
WHERE project_id IS NOT NULL;

-- Grant insert permission to authenticated users for project_subscriptions table
GRANT INSERT ON public.project_subscriptions TO authenticated;