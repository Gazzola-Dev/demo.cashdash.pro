-- Add current_milestone_id column to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS current_milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL;

-- First drop the existing function if needed to avoid return type conflict
DROP FUNCTION IF EXISTS public.get_app_data();

-- Create the get_app_data function with current_milestone data
CREATE FUNCTION public.get_app_data()
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

  -- Get the profile with joined project data
  SELECT 
    jsonb_build_object(
      'profile', p,
      'projects', COALESCE(
        (
          SELECT jsonb_agg(pr)
          FROM projects pr
          INNER JOIN project_members pm ON pr.id = pm.project_id
          WHERE pm.user_id = p.id
        ),
        '[]'::jsonb
      ),
      'project', CASE 
        WHEN p.current_project_id IS NOT NULL THEN (
          SELECT jsonb_build_object(
            'id', pr.id,
            'name', pr.name,
            'description', pr.description,
            'status', pr.status,
            'subscription_status', pr.subscription_status,
            'slug', pr.slug,
            'prefix', pr.prefix,
            'current_milestone_id', pr.current_milestone_id,
            'icon_name', pr.icon_name,
            'icon_color_fg', pr.icon_color_fg,
            'icon_color_bg', pr.icon_color_bg,
            'github_repo_url', pr.github_repo_url,
            'github_owner', pr.github_owner,
            'github_repo', pr.github_repo,
            'created_at', pr.created_at,
            'updated_at', pr.updated_at,
            'project_members', (
              SELECT COALESCE(
                  jsonb_agg(
                    jsonb_build_object(
                      'id', pm.id,
                      'project_id', pm.project_id,
                      'user_id', pm.user_id,
                      'role', pm.role,
                      'created_at', pm.created_at,
                      'profile', prof_m
                    )
                  ),
                  '[]'::jsonb
              )
              FROM project_members pm
              LEFT JOIN profiles prof_m ON pm.user_id = prof_m.id
              WHERE pm.project_id = pr.id
            ),
            'project_invitations', (
              SELECT COALESCE(
                  jsonb_agg(
                    jsonb_build_object(
                      'id', pi.id,
                      'project_id', pi.project_id,
                      'email', pi.email,
                      'role', pi.role,
                      'status', pi.status,
                      'created_at', pi.created_at,
                      'expires_at', pi.expires_at,
                      'invited_by', pi.invited_by,
                      'profile', prof_i
                    )
                  ),
                  '[]'::jsonb
              )
              FROM project_invitations pi
              LEFT JOIN profiles prof_i ON pi.invited_by = prof_i.id
              WHERE pi.project_id = pr.id
            )
          )
          FROM projects pr
          WHERE pr.id = p.current_project_id
        )
        ELSE NULL
      END,
      'tasks', CASE 
        WHEN p.current_project_id IS NOT NULL THEN (
          SELECT COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'id', t.id,
                  'title', t.title,
                  'description', t.description, 
                  'status', t.status,
                  'priority', t.priority,
                  'assignee', t.assignee,
                  'ordinal_id', t.ordinal_id,
                  'ordinal_priority', t.ordinal_priority,
                  'created_at', t.created_at,
                  'updated_at', t.updated_at,
                  'slug', t.slug,
                  'prefix', t.prefix,
                  'project_id', t.project_id,
                  'budget_cents', t.budget_cents,
                  'estimated_minutes', t.estimated_minutes,
                  'recorded_minutes', t.recorded_minutes,
                  'assignee_profile', prof_a
                )
              ),
              '[]'::jsonb
          )
          FROM tasks t
          LEFT JOIN profiles prof_a ON t.assignee = prof_a.id
          LEFT JOIN projects pr ON t.project_id = pr.id
          LEFT JOIN milestone_tasks mt ON t.id = mt.task_id
          WHERE t.project_id = p.current_project_id
          AND (
            -- If current_milestone_id is set, only get tasks for that milestone
            (pr.current_milestone_id IS NOT NULL AND mt.milestone_id = pr.current_milestone_id)
            OR
            -- If no current_milestone_id, get all tasks
            (pr.current_milestone_id IS NULL)
          )
        )
        ELSE '[]'::jsonb
      END,
      'invitations', (
        SELECT COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', pi.id,
              'project_id', pi.project_id,
              'email', pi.email,
              'role', pi.role,
              'status', pi.status,
              'invited_by', pi.invited_by,
              'expires_at', pi.expires_at,
              'created_at', pi.created_at,
              'project', (
                SELECT jsonb_build_object(
                  'id', pr.id,
                  'name', pr.name,
                  'description', pr.description,
                  'prefix', pr.prefix,
                  'slug', pr.slug
                )
                FROM projects pr
                WHERE pr.id = pi.project_id
              ),
              'inviter', (
                SELECT jsonb_build_object(
                  'id', prof_i.id,
                  'display_name', prof_i.display_name,
                  'avatar_url', prof_i.avatar_url
                )
                FROM profiles prof_i
                WHERE prof_i.id = pi.invited_by
              )
            )
          ),
          '[]'::jsonb
        )
        FROM project_invitations pi
        WHERE pi.email = p.email
        AND pi.status = 'pending'
      ),
      'current_milestone', CASE 
        WHEN p.current_project_id IS NOT NULL THEN (
          SELECT jsonb_build_object(
            'id', m.id,
            'title', m.title,
            'description', m.description,
            'start_date', m.start_date,
            'due_date', m.due_date,
            'status', m.status,
            'payment_cents', m.payment_cents,
            'payment_status', m.payment_status,
            'project_id', m.project_id,
            'created_at', m.created_at,
            'updated_at', m.updated_at,
            'tasks', (
              SELECT COALESCE(
                jsonb_agg(
                  jsonb_build_object(
                    'id', t.id,
                    'title', t.title
                  )
                ),
                '[]'::jsonb
              )
              FROM milestone_tasks mt
              JOIN tasks t ON mt.task_id = t.id
              WHERE mt.milestone_id = m.id
            )
          )
          FROM projects pr
          JOIN milestones m ON pr.current_milestone_id = m.id
          WHERE pr.id = p.current_project_id
        )
        ELSE NULL
      END
    ) INTO result
    FROM profiles p
    WHERE p.id = auth.uid();

  RETURN result;
END;
$$;

-- Create a function to set the current milestone for a project
CREATE OR REPLACE FUNCTION public.set_project_current_milestone(
  p_project_id UUID,
  p_milestone_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_member BOOLEAN;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if user is a member of the project with admin or owner role
  SELECT EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = p_project_id 
    AND user_id = v_user_id
    AND role IN ('admin', 'owner')
  ) INTO v_is_member;
  
  -- If not a member with correct permissions, return false
  IF NOT v_is_member THEN
    RETURN false;
  END IF;
  
  -- Update the project's current milestone
  UPDATE projects 
  SET current_milestone_id = p_milestone_id
  WHERE id = p_project_id;
  
  RETURN true;
END;
$$;

-- Create a function to get all milestones for a project
CREATE OR REPLACE FUNCTION public.list_project_milestones(project_slug text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', m.id,
      'title', m.title,
      'description', m.description,
      'start_date', m.start_date,
      'due_date', m.due_date,
      'status', m.status,
      'payment_cents', m.payment_cents,
      'payment_status', m.payment_status,
      'project_id', m.project_id,
      'created_at', m.created_at,
      'updated_at', m.updated_at,
      'is_current', (p.current_milestone_id = m.id),
      'tasks_count', (
        SELECT COUNT(*)
        FROM milestone_tasks mt
        WHERE mt.milestone_id = m.id
      ),
      'tasks_completed', (
        SELECT COUNT(*)
        FROM milestone_tasks mt
        JOIN tasks t ON mt.task_id = t.id
        WHERE mt.milestone_id = m.id
        AND t.status = 'completed'
      )
    )::json
  FROM milestones m
  JOIN projects p ON m.project_id = p.id
  WHERE p.slug = project_slug
  ORDER BY m.due_date ASC NULLS LAST;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_app_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_project_milestones(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_project_current_milestone(UUID, UUID) TO authenticated;