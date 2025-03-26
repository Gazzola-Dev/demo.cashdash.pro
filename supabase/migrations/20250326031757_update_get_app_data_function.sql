-- Migration to update the get_app_data function to include missing fields
-- This adds fields from app.types.ts that were missing in the current implementation

CREATE OR REPLACE FUNCTION public.get_app_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile profiles;
  v_app_role app_role;
  v_is_admin BOOLEAN;
  v_current_project_id UUID;
  v_current_project projects;
  v_project_member_role TEXT;
  v_contract json;
  v_milestone json;
  result json;
BEGIN
  -- Get the current user's ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user profile data
  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
  
  -- Get app role (admin status)
  SELECT role INTO v_app_role FROM user_roles WHERE user_id = v_user_id LIMIT 1;
  v_is_admin := v_app_role IS NOT NULL;
  
  -- Get current project ID from profile
  v_current_project_id := v_profile.current_project_id;
  
  -- Get current project data if there is a current project
  IF v_current_project_id IS NOT NULL THEN
    SELECT * INTO v_current_project FROM projects WHERE id = v_current_project_id;
    
    -- Get project member role
    SELECT role INTO v_project_member_role 
    FROM project_members 
    WHERE project_id = v_current_project_id AND user_id = v_user_id
    LIMIT 1;
    
    -- Get current milestone data if available
    IF v_current_project.current_milestone_id IS NOT NULL THEN
      SELECT 
        jsonb_build_object(
          'id', m.id,
          'title', m.title,
          'description', m.description,
          'start_date', m.start_date,
          'due_date', m.due_date,
          'status', m.status,
          'project_id', m.project_id,
          'created_at', m.created_at,
          'updated_at', m.updated_at,
          'payment_cents', m.payment_cents,
          'payment_status', m.payment_status,
          'is_current', true,
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
          ),
          'events', COALESCE(
            (SELECT json_agg(e.*)
            FROM get_milestone_events(m.id) e),
            '[]'::json
          )
        ) INTO v_milestone
      FROM milestones m
      WHERE m.id = v_current_project.current_milestone_id
      LIMIT 1;
    END IF;
    
    -- Get contract data if available
    SELECT 
      jsonb_build_object(
        'contract', jsonb_build_object(
          'id', c.id,
          'project_id', c.project_id,
          'title', c.title,
          'client_name', c.client_name,
          'client_company', c.client_company,
          'currency', c.currency,
          'description', c.description,
          'start_date', c.start_date,
          'end_date', c.end_date,
          'status', c.status,
          'total_amount_cents', c.total_amount_cents,
          'created_at', c.created_at,
          'updated_at', c.updated_at,
          'upwork_contract_id', c.upwork_contract_id
        ),
        'members', COALESCE(
          (SELECT json_agg(
            jsonb_build_object(
              'id', p.id,
              'display_name', p.display_name,
              'email', p.email,
              'avatar_url', p.avatar_url,
              'role', cm.role,
              'hasApproved', EXISTS (
                SELECT 1 FROM contract_approvals ca 
                WHERE ca.contract_id = c.id AND ca.user_id = p.id AND ca.approved = true
              )
            )
          )
          FROM contract_members cm
          JOIN profiles p ON cm.user_id = p.id
          WHERE cm.contract_id = c.id),
          '[]'::json
        )
      ) INTO v_contract
    FROM contracts c
    WHERE c.project_id = v_current_project_id
    ORDER BY c.created_at DESC
    LIMIT 1;
  END IF;
  
  -- Build the final result matching AppState shape (excluding setters)
  SELECT json_build_object(
    -- User data
    'user', (
      SELECT row_to_json(u) 
      FROM auth.users u 
      WHERE u.id = v_user_id
    ),
    'profile', row_to_json(v_profile),
    
    -- Projects data
    'projects', COALESCE(
      (SELECT json_agg(p)
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = v_user_id),
      '[]'::json
    ),
    'project', CASE 
      WHEN v_current_project_id IS NOT NULL THEN
        (SELECT json_build_object(
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
          'current_milestone_id', p.current_milestone_id,
          'subscription_status', p.subscription_status,
          'icon_color_bg', p.icon_color_bg,
          'icon_color_fg', p.icon_color_fg,
          'icon_name', p.icon_name,
          'project_members', COALESCE(
            (SELECT json_agg(
              jsonb_build_object(
                'id', pm.id,
                'project_id', pm.project_id,
                'user_id', pm.user_id,
                'role', pm.role,
                'created_at', pm.created_at,
                'profile', prof
              )
            )
            FROM project_members pm
            LEFT JOIN profiles prof ON pm.user_id = prof.id
            WHERE pm.project_id = p.id),
            '[]'::json
          ),
          'project_invitations', COALESCE(
            (SELECT json_agg(
              jsonb_build_object(
                'id', pi.id,
                'project_id', pi.project_id,
                'email', pi.email,
                'role', pi.role,
                'status', pi.status,
                'created_at', pi.created_at,
                'expires_at', pi.expires_at,
                'profile', inv_prof
              )
            )
            FROM project_invitations pi
            LEFT JOIN profiles inv_prof ON pi.invited_by = inv_prof.id
            WHERE pi.project_id = p.id),
            '[]'::json
          )
        )
        FROM projects p
        WHERE p.id = v_current_project_id)
      ELSE NULL
    END,
    
    -- Tasks data
    'tasks', COALESCE(
      (SELECT json_agg(
        jsonb_build_object(
          'id', t.id,
          'title', t.title,
          'description', t.description,
          'status', t.status,
          'priority', t.priority,
          'assignee', t.assignee,
          'project_id', t.project_id,
          'slug', t.slug,
          'prefix', t.prefix,
          'created_at', t.created_at,
          'updated_at', t.updated_at,
          'budget_cents', t.budget_cents,
          'estimated_minutes', t.estimated_minutes,
          'ordinal_id', t.ordinal_id,
          'ordinal_priority', t.ordinal_priority,
          'recorded_minutes', t.recorded_minutes,
          'start_time', t.start_time,
          'assignee_profile', prof_a
        )
      )
      FROM tasks t
      LEFT JOIN profiles prof_a ON t.assignee = prof_a.id
      WHERE t.project_id = v_current_project_id),
      '[]'::json
    ),
    'task', null, -- Task is not included in the initial load
    
    -- Invitations
    'userInvitations', COALESCE(
      (SELECT json_agg(
        jsonb_build_object(
          'invitation', pi,
          'project', p,
          'sender_profile', jsonb_build_object(
            'id', prof_s.id,
            'display_name', prof_s.display_name,
            'avatar_url', prof_s.avatar_url,
            'professional_title', prof_s.professional_title
          )
        )
      )
      FROM project_invitations pi
      JOIN projects p ON pi.project_id = p.id
      JOIN profiles prof_s ON pi.invited_by = prof_s.id
      JOIN auth.users u ON u.email = pi.email
      WHERE u.id = v_user_id AND pi.status = 'pending'),
      '[]'::json
    ),
    'projectInvitations', CASE 
      WHEN v_current_project_id IS NOT NULL THEN
        COALESCE(
          (SELECT json_agg(
            jsonb_build_object(
              'invitation', pi,
              'project', p,
              'sender_profile', jsonb_build_object(
                'id', prof_s.id,
                'display_name', prof_s.display_name,
                'avatar_url', prof_s.avatar_url,
                'professional_title', prof_s.professional_title
              )
            )
          )
          FROM project_invitations pi
          JOIN projects p ON pi.project_id = p.id
          JOIN profiles prof_s ON pi.invited_by = prof_s.id
          WHERE p.id = v_current_project_id),
          '[]'::json
        )
      ELSE '[]'::json
    END,
    
    -- Milestone data
    'milestone', v_milestone,
    
    -- Contract data
    'contract', v_contract,
    
    -- Subscription data
    'subscription', (
      SELECT row_to_json(ps)
      FROM project_subscriptions ps
      WHERE ps.project_id = v_current_project_id
      ORDER BY ps.created_at DESC
      LIMIT 1
    ),
    
    -- Role data
    'appRole', v_app_role,
    'isAdmin', v_is_admin,
    'projectMemberRole', v_project_member_role
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_app_data() TO authenticated;

-- Revoke execute permission from anon and public users
REVOKE EXECUTE ON FUNCTION public.get_app_data() FROM anon, public;