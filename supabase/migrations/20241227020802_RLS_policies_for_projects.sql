-- First, let's create policies for the projects table
CREATE POLICY "Enable insert for authenticated users" 
ON public.projects
FOR INSERT 
TO authenticated 
WITH CHECK (true);

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

-- Create a function to handle project creation with owner in a transaction
CREATE OR REPLACE FUNCTION public.create_project_with_owner(
    project_data jsonb,
    owner_id uuid
) RETURNS public.projects
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_project public.projects;
BEGIN
    -- Insert the project
    INSERT INTO public.projects (
        name,
        prefix,
        slug,
        status,
        github_repo_url,
        github_owner,
        github_repo,
        description
    )
    VALUES (
        project_data->>'name',
        project_data->>'prefix',
        project_data->>'slug',
        (project_data->>'status')::public.project_status,
        project_data->>'github_repo_url',
        project_data->>'github_owner',
        project_data->>'github_repo',
        (project_data->>'description')::jsonb
    )
    RETURNING * INTO new_project;

    -- Add the creator as project owner
    INSERT INTO public.project_members (
        project_id,
        user_id,
        role
    ) VALUES (
        new_project.id,
        owner_id,
        'owner'
    );

    RETURN new_project;
END;
$$;