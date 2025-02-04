CREATE OR REPLACE FUNCTION public.list_projects(
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_sort_column text DEFAULT 'created_at',
  p_sort_order text DEFAULT 'desc'
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
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
      'project_members', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', pm.id,
            'project_id', pm.project_id,
            'user_id', pm.user_id,
            'role', pm.role,
            'created_at', pm.created_at,
            'profile', prof_m
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
            'inviter', prof_i
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
    )::json
  FROM projects p
  LEFT JOIN project_members pm ON p.id = pm.project_id
  LEFT JOIN profiles prof_m ON pm.user_id = prof_m.id
  LEFT JOIN project_invitations pi ON p.id = pi.project_id
  LEFT JOIN profiles prof_i ON pi.invited_by = prof_i.id
  LEFT JOIN tasks t ON p.id = t.project_id
  LEFT JOIN external_integrations ei ON p.id = ei.project_id
  LEFT JOIN project_metrics pmet ON p.id = pmet.project_id
  WHERE 
    (p_status IS NULL OR p.status::text = p_status) AND
    (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
  GROUP BY p.id, p.name, p.description, p.status, p.slug, p.prefix, 
           p.github_repo_url, p.github_owner, p.github_repo, p.created_at, p.updated_at
  ORDER BY
    CASE WHEN p_sort_order = 'asc' THEN
      CASE p_sort_column
        WHEN 'name' THEN p.name
        WHEN 'status' THEN p.status::text
        WHEN 'created_at' THEN p.created_at::text
        ELSE p.created_at::text
      END
    END ASC NULLS LAST,
    CASE WHEN p_sort_order = 'desc' OR p_sort_order IS NULL THEN
      CASE p_sort_column
        WHEN 'name' THEN p.name
        WHEN 'status' THEN p.status::text
        WHEN 'created_at' THEN p.created_at::text
        ELSE p.created_at::text
      END
    END DESC NULLS LAST;
END;
$$;