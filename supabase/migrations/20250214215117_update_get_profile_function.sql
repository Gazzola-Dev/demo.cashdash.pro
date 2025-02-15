-- Updated get_profile_data function with enriched current project
CREATE OR REPLACE FUNCTION public.get_profile_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Get the current user's ID
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  WITH profile_data AS (
    SELECT
      p.*,
      -- Get projects with role information
      COALESCE(
        json_agg(
          json_build_object(
            'project', proj,
            'role', pm.role,
            'created_at', pm.created_at
          )
        ) FILTER (WHERE proj.id IS NOT NULL),
        '[]'::json
      ) as projects,
      -- Get enriched current project with all tasks
      (
        SELECT json_build_object(
          'id', cp.id,
          'name', cp.name,
          'description', cp.description,
          'status', cp.status,
          'slug', cp.slug,
          'prefix', cp.prefix,
          'github_repo_url', cp.github_repo_url,
          'github_owner', cp.github_owner,
          'github_repo', cp.github_repo,
          'created_at', cp.created_at,
          'updated_at', cp.updated_at,
          'tasks', COALESCE(
            json_agg(
              json_build_object(
                'id', t.id,
                'title', t.title,
                'description', t.description,
                'status', t.status,
                'priority', t.priority,
                'assignee', t.assignee,
                'slug', t.slug,
                'prefix', t.prefix,
                'ordinal_id', t.ordinal_id,
                'created_at', t.created_at,
                'updated_at', t.updated_at,
                'subtasks', (
                  SELECT COALESCE(
                    json_agg(
                      json_build_object(
                        'id', s.id,
                        'title', s.title,
                        'description', s.description,
                        'status', s.status,
                        'ordinal_id', s.ordinal_id,
                        'created_at', s.created_at,
                        'updated_at', s.updated_at
                      )
                    ),
                    '[]'::json
                  )
                  FROM subtasks s
                  WHERE s.task_id = t.id
                ),
                'task_schedule', (
                  SELECT json_build_object(
                    'id', ts.id,
                    'start_date', ts.start_date,
                    'due_date', ts.due_date,
                    'estimated_hours', ts.estimated_hours,
                    'actual_hours', ts.actual_hours,
                    'completed_at', ts.completed_at
                  )
                  FROM task_schedule ts
                  WHERE ts.task_id = t.id
                  LIMIT 1
                )
              )
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::json
          )
        )
        FROM projects cp
        LEFT JOIN tasks t ON t.project_id = cp.id
        WHERE cp.id = p.current_project_id
        GROUP BY cp.id, cp.name, cp.description, cp.status, cp.slug, cp.prefix,
                cp.github_repo_url, cp.github_owner, cp.github_repo,
                cp.created_at, cp.updated_at
      ) as current_project
    FROM profiles p
    LEFT JOIN project_members pm ON pm.user_id = p.id
    LEFT JOIN projects proj ON proj.id = pm.project_id
    WHERE p.id = auth.uid()
    GROUP BY p.id, p.email, p.created_at, p.updated_at, p.display_name,
             p.avatar_url, p.professional_title, p.bio, p.github_username,
             p.timezone, p.website, p.notification_preferences,
             p.ui_preferences, p.current_project_id
  )
  SELECT json_build_object(
    'profile', to_jsonb(pd.*) - 'projects' - 'current_project',
    'projects', pd.projects,
    'current_project', pd.current_project
  ) INTO result
  FROM profile_data pd;

  RETURN result;
END;
$$;
