-- Migration: 20240917151946_enable_realtime_for_invites.sql

-- First, drop the existing function if it exists
DROP FUNCTION IF EXISTS public.get_app_data();

-- Create the enhanced get_app_data function
CREATE OR REPLACE FUNCTION public.get_app_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_project_id UUID;
  result json;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the current project ID from the profile
  SELECT current_project_id INTO v_current_project_id
  FROM profiles
  WHERE id = v_user_id;

  SELECT
    jsonb_build_object(
      -- User and profile data
      'user', auth.users.id,  -- Only include the ID since the full user object is handled client-side
      'profile', prof_data,
      
      -- Projects data
      'projects', COALESCE(
        (SELECT jsonb_agg(p)
          FROM projects p
          INNER JOIN project_members pm ON p.id = pm.project_id
          WHERE pm.user_id = v_user_id
        ),
        '[]'::jsonb
      ),
      
      -- Current project with details
      'project', (
        SELECT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'status', p.status,
          'slug', p.slug,
          'prefix', p.prefix,
          'current_milestone_id', p.current_milestone_id,
          'github_repo_url', p.github_repo_url,
          'github_owner', p.github_owner,
          'github_repo', p.github_repo,
          'icon_name', p.icon_name,
          'icon_color_bg', p.icon_color_bg,
          'icon_color_fg', p.icon_color_fg,
          'subscription_status', p.subscription_status,
          'created_at', p.created_at,
          'updated_at', p.updated_at,
          'project_members', COALESCE(
            (SELECT jsonb_agg(
              jsonb_build_object(
                'id', pm.id,
                'project_id', pm.project_id,
                'user_id', pm.user_id,
                'role', pm.role,
                'created_at', pm.created_at,
                'profile', member_prof
              )
            )
            FROM project_members pm
            LEFT JOIN profiles member_prof ON pm.user_id = member_prof.id
            WHERE pm.project_id = p.id
            ),
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
                'created_at', pi.created_at,
                'expires_at', pi.expires_at,
                'invited_by', pi.invited_by,
                'profile', inv_prof
              )
            )
            FROM project_invitations pi
            LEFT JOIN profiles inv_prof ON pi.invited_by = inv_prof.id
            WHERE pi.project_id = p.id
            ),
            '[]'::jsonb
          )
        )
        FROM projects p
        WHERE p.id = v_current_project_id
      ),
      
      -- Tasks assigned to user IN THE CURRENT PROJECT
      'tasks', COALESCE(
        (SELECT jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'title', t.title,
            'description', t.description,
            'status', t.status,
            'priority', t.priority,
            'assignee', t.assignee,
            'slug', t.slug,
            'project_id', t.project_id,
            'prefix', t.prefix,
            'created_at', t.created_at,
            'updated_at', t.updated_at,
            'assignee_profile', task_prof
          ) ORDER BY 
            CASE t.priority
              WHEN 'urgent' THEN 0
              WHEN 'high' THEN 1 
              WHEN 'medium' THEN 2
              WHEN 'low' THEN 3
              ELSE 4
            END,
            t.created_at DESC
        )
        FROM tasks t
        LEFT JOIN profiles task_prof ON t.assignee = task_prof.id
        WHERE t.assignee = v_user_id
        AND t.project_id = v_current_project_id
        ),
        '[]'::jsonb
      ),
      
      -- User invitations
      'userInvitations', COALESCE(
        (SELECT jsonb_agg(
          jsonb_build_object(
            'invitation', jsonb_build_object(
              'id', pi.id,
              'project_id', pi.project_id,
              'email', pi.email,
              'role', pi.role,
              'status', pi.status,
              'created_at', pi.created_at,
              'expires_at', pi.expires_at,
              'invited_by', pi.invited_by
            ),
            'project', jsonb_build_object(
              'id', p.id,
              'name', p.name,
              'description', p.description,
              'slug', p.slug,
              'prefix', p.prefix,
              'status', p.status
            ),
            'sender_profile', jsonb_build_object(
              'id', sender_prof.id,
              'display_name', sender_prof.display_name,
              'avatar_url', sender_prof.avatar_url,
              'professional_title', sender_prof.professional_title
            )
          )
        )
        FROM project_invitations pi
        JOIN projects p ON pi.project_id = p.id
        JOIN profiles sender_prof ON pi.invited_by = sender_prof.id
        JOIN profiles recipient_prof ON recipient_prof.email = pi.email
        WHERE recipient_prof.id = v_user_id AND pi.status = 'pending'
        ),
        '[]'::jsonb
      ),
      
      -- Project invitations for the current project
      'projectInvitations', COALESCE(
        (SELECT jsonb_agg(
          jsonb_build_object(
            'invitation', jsonb_build_object(
              'id', pi.id,
              'project_id', pi.project_id,
              'email', pi.email,
              'role', pi.role,
              'status', pi.status,
              'created_at', pi.created_at,
              'expires_at', pi.expires_at,
              'invited_by', pi.invited_by
            ),
            'project', jsonb_build_object(
              'id', p.id,
              'name', p.name,
              'description', p.description,
              'slug', p.slug,
              'prefix', p.prefix,
              'status', p.status
            ),
            'sender_profile', jsonb_build_object(
              'id', sender_prof.id,
              'display_name', sender_prof.display_name,
              'avatar_url', sender_prof.avatar_url,
              'professional_title', sender_prof.professional_title
            )
          )
        )
        FROM project_invitations pi
        JOIN projects p ON pi.project_id = p.id
        JOIN profiles sender_prof ON pi.invited_by = sender_prof.id
        WHERE pi.project_id = v_current_project_id AND pi.status = 'pending'
        ),
        '[]'::jsonb
      ),
      
      -- Current milestone
      'milestone', (
        SELECT 
        CASE WHEN p.current_milestone_id IS NOT NULL THEN
          jsonb_build_object(
            'id', m.id,
            'project_id', m.project_id,
            'title', m.title,
            'description', m.description,
            'start_date', m.start_date,
            'due_date', m.due_date,
            'status', m.status,
            'payment_cents', m.payment_cents,
            'payment_status', m.payment_status,
            'created_at', m.created_at,
            'updated_at', m.updated_at,
            'is_current', true,
            'tasks', COALESCE(
              (SELECT jsonb_agg(jsonb_build_object(
                'id', t.id,
                'title', t.title
              ))
              FROM milestone_tasks mt
              JOIN tasks t ON mt.task_id = t.id
              WHERE mt.milestone_id = m.id
              ),
              '[]'::jsonb
            ),
            'tasks_count', (
              SELECT COUNT(*)
              FROM milestone_tasks mt
              WHERE mt.milestone_id = m.id
            ),
            'tasks_completed', (
              SELECT COUNT(*)
              FROM milestone_tasks mt
              JOIN tasks t ON mt.task_id = t.id
              WHERE mt.milestone_id = m.id AND t.status = 'completed'
            )
          )
        ELSE NULL END
        FROM projects p
        LEFT JOIN milestones m ON p.current_milestone_id = m.id
        WHERE p.id = v_current_project_id
      ),
      
      -- Project subscription
      'subscription', (
        SELECT row_to_json(ps)
        FROM project_subscriptions ps
        WHERE ps.project_id = v_current_project_id
        LIMIT 1
      ),
      
      -- User roles
      'appRole', (
        SELECT ur.role
        FROM user_roles ur
        WHERE ur.user_id = v_user_id
        LIMIT 1
      ),
      
      -- Project member role
      'projectMemberRole', (
        SELECT pm.role
        FROM project_members pm
        WHERE pm.project_id = v_current_project_id
        AND pm.user_id = v_user_id
        LIMIT 1
      )
    ) INTO result
  FROM profiles prof_data
  LEFT JOIN auth.users ON auth.users.id = prof_data.id
  WHERE prof_data.id = v_user_id;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_app_data() TO authenticated;