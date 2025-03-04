-- Migration to fix assignee_profile in get_app_data
-- File: supabase/migrations/20250304064616_fix_get_app_data_function.sql

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.get_app_data();

-- Create the updated function with proper assignee profile data retrieval
CREATE OR REPLACE FUNCTION public.get_app_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile jsonb;
  v_projects jsonb;
  v_invitations jsonb;
  v_tasks jsonb;
  result jsonb;
  v_project jsonb;
  v_project_id uuid;
BEGIN
  -- Get the current user's ID
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user profile first
  SELECT to_jsonb(prof) INTO v_profile
  FROM profiles prof
  WHERE prof.id = auth.uid();
  
  -- Get projects
  SELECT COALESCE(
    jsonb_agg(DISTINCT to_jsonb(p)),
    '[]'::jsonb
  ) INTO v_projects
  FROM project_members pm
  JOIN projects p ON pm.project_id = p.id
  WHERE pm.user_id = auth.uid();
  
  -- Get pending invitations
  SELECT COALESCE(
    jsonb_agg(DISTINCT to_jsonb(pi)),
    '[]'::jsonb
  ) INTO v_invitations
  FROM project_invitations pi
  WHERE pi.email = (
    SELECT email FROM profiles WHERE id = auth.uid()
  ) AND pi.status = 'pending';
  
  -- Get tasks with assignee profiles
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'title', t.title,
        'description', t.description,
        'status', t.status,
        'priority', t.priority,
        'assignee', t.assignee,
        'project_id', t.project_id,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'slug', t.slug,
        'prefix', t.prefix,
        'ordinal_id', t.ordinal_id,
        'ordinal_priority', t.ordinal_priority,
        'budget_cents', t.budget_cents,
        'estimated_minutes', t.estimated_minutes,
        'recorded_minutes', t.recorded_minutes,
        'start_time', t.start_time,
        'assignee_profile', CASE 
          WHEN assignee_prof.id IS NOT NULL THEN to_jsonb(assignee_prof) 
          ELSE NULL 
        END
      )
    ),
    '[]'::jsonb
  ) INTO v_tasks
  FROM tasks t
  LEFT JOIN profiles assignee_prof ON t.assignee = assignee_prof.id
  WHERE t.project_id = (
    SELECT current_project_id FROM profiles WHERE id = auth.uid()
  );
  
  -- Build the combined result
  result := jsonb_build_object(
    'profile', v_profile,
    'projects', v_projects,
    'invitations', v_invitations,
    'tasks', v_tasks
  );

  -- Add the current project with details if it exists
  IF v_profile->>'current_project_id' IS NOT NULL THEN
    v_project_id := (v_profile->>'current_project_id')::uuid;
    
    -- Get project basic data
    SELECT to_jsonb(p) INTO v_project
    FROM projects p
    WHERE p.id = v_project_id;
    
    IF v_project IS NOT NULL THEN
      -- Get project members with profiles
      SELECT jsonb_build_object(
        'id', v_project->>'id',
        'name', v_project->>'name',
        'description', v_project->>'description',
        'prefix', v_project->>'prefix',
        'slug', v_project->>'slug',
        'status', v_project->>'status',
        'github_repo_url', v_project->>'github_repo_url',
        'github_owner', v_project->>'github_owner',
        'github_repo', v_project->>'github_repo',
        'icon_name', v_project->>'icon_name',
        'icon_color_fg', v_project->>'icon_color_fg',
        'icon_color_bg', v_project->>'icon_color_bg',
        'created_at', v_project->>'created_at',
        'updated_at', v_project->>'updated_at',
        'subscription_status', v_project->>'subscription_status',
        'project_members', COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'id', pm.id,
              'user_id', pm.user_id,
              'project_id', pm.project_id,
              'role', pm.role,
              'created_at', pm.created_at,
              'profile', to_jsonb(member_profile)
            )
          )
          FROM project_members pm
          LEFT JOIN profiles member_profile ON pm.user_id = member_profile.id
          WHERE pm.project_id = v_project_id),
          '[]'::jsonb
        ),
        'project_invitations', COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'id', pi.id,
              'project_id', pi.project_id,
              'email', pi.email,
              'role', pi.role,
              'status', pi.status,
              'invited_by', pi.invited_by,
              'created_at', pi.created_at,
              'expires_at', pi.expires_at,
              'profile', to_jsonb(inviter_profile)
            )
          )
          FROM project_invitations pi
          LEFT JOIN profiles inviter_profile ON pi.invited_by = inviter_profile.id
          WHERE pi.project_id = v_project_id),
          '[]'::jsonb
        )
      ) INTO v_project;
      
      -- Add the project to result using jsonb_set (fixed)
      result := jsonb_set(result, '{project}', v_project);
    END IF;
  END IF;

  RETURN result;
END;
$$;

-- Ensure the function is accessible
GRANT EXECUTE ON FUNCTION public.get_app_data() TO authenticated;