-- Drop existing policies and function
DROP POLICY IF EXISTS "Enable read access for project members" ON projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable update for project admins and owners" ON projects;
DROP POLICY IF EXISTS "Enable delete for project owners" ON projects;
DROP FUNCTION IF EXISTS public.get_project_data(text);

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects table
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

CREATE POLICY "Enable insert for authenticated users"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (true);

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

-- Create updated get_project_data function with debug logging
CREATE OR REPLACE FUNCTION public.get_project_data(project_slug TEXT)
RETURNS json
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  result json;
  debug_info jsonb;
  user_id uuid;
  project_exists boolean;
  user_has_access boolean;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  -- Check if project exists
  SELECT EXISTS (
    SELECT 1 FROM projects WHERE slug = project_slug
  ) INTO project_exists;

  -- Check if user has access
  SELECT EXISTS (
    SELECT 1 
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE p.slug = project_slug
    AND pm.user_id = user_id
  ) INTO user_has_access;

  -- Build debug info
  debug_info := jsonb_build_object(
    'debug_info', jsonb_build_object(
      'project_slug', project_slug,
      'user_id', user_id,
      'project_exists', project_exists,
      'user_has_access', user_has_access,
      'timestamp', now()
    )
  );

  -- Select project data with all relationships in a single query
  SELECT 
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'description', p.description,
      'status', p.status,
      'slug', p.slug,
      'prefix', p.prefix,
      'github_repo_url', p.github_repo_url,
      'github_owner', p.github_owner,
      'github_repo', p.github_repo,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'debug', debug_info,
      'project_members', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', pm.id,
            'project_id', pm.project_id,
            'user_id', pm.user_id,
            'role', pm.role,
            'created_at', pm.created_at,
            'profile', CASE 
              WHEN prof_m.id IS NOT NULL THEN
                jsonb_build_object(
                  'id', prof_m.id,
                  'display_name', prof_m.display_name,
                  'avatar_url', prof_m.avatar_url,
                  'professional_title', prof_m.professional_title,
                  'email', prof_m.email
                )
              ELSE NULL
            END
          )
        ) FILTER (WHERE pm.id IS NOT NULL),
        '[]'::jsonb
      ),
      'project_invitations', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', pi.id,
            'project_id', pi.project_id,
            'email', pi.email,
            'role', pi.role,
            'status', pi.status,
            'created_at', pi.created_at,
            'expires_at', pi.expires_at,
            'inviter', CASE 
              WHEN prof_i.id IS NOT NULL THEN
                jsonb_build_object(
                  'id', prof_i.id,
                  'display_name', prof_i.display_name,
                  'avatar_url', prof_i.avatar_url,
                  'professional_title', prof_i.professional_title,
                  'email', prof_i.email
                )
              ELSE NULL
            END
          )
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'::jsonb
      ),
      'tasks', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'title', t.title,
            'description', t.description,
            'status', t.status,
            'priority', t.priority,
            'assignee', t.assignee,
            'slug', t.slug,
            'prefix', t.prefix,
            'created_at', t.created_at,
            'updated_at', t.updated_at
          )
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'::jsonb
      ),
      'external_integrations', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', ei.id,
            'project_id', ei.project_id,
            'provider', ei.provider,
            'settings', ei.settings,
            'credentials', ei.credentials
          )
        ) FILTER (WHERE ei.id IS NOT NULL),
        '[]'::jsonb
      ),
      'project_metrics', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', pmet.id,
            'project_id', pmet.project_id,
            'date', pmet.date,
            'velocity', pmet.velocity,
            'burn_rate_cents', pmet.burn_rate_cents,
            'completion_percentage', pmet.completion_percentage
          )
        ) FILTER (WHERE pmet.id IS NOT NULL),
        '[]'::jsonb
      )
    )::json INTO result
  FROM projects p
  LEFT JOIN project_members pm ON p.id = pm.project_id
  LEFT JOIN profiles prof_m ON pm.user_id = prof_m.id
  LEFT JOIN project_invitations pi ON p.id = pi.project_id
  LEFT JOIN profiles prof_i ON pi.invited_by = prof_i.id
  LEFT JOIN tasks t ON p.id = t.project_id
  LEFT JOIN external_integrations ei ON p.id = ei.project_id
  LEFT JOIN project_metrics pmet ON p.id = pmet.project_id
  WHERE p.slug = project_slug
  GROUP BY p.id;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Project not found or access denied: %', debug_info;
  END IF;

  RETURN result;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_data(TEXT) TO authenticated;