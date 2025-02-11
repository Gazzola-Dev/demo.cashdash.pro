-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.update_profile_data;

-- Create new update_profile_data function
CREATE OR REPLACE FUNCTION public.update_profile_data(
  p_user_id UUID,
  p_updates JSONB
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  updated_profile profiles;
BEGIN
  -- First verify the profile exists
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Update the profile
  UPDATE profiles
  SET
    display_name = COALESCE((p_updates->>'display_name')::text, display_name),
    avatar_url = COALESCE((p_updates->>'avatar_url')::text, avatar_url),
    professional_title = COALESCE((p_updates->>'professional_title')::text, professional_title),
    bio = COALESCE((p_updates->>'bio')::text, bio),
    github_username = COALESCE((p_updates->>'github_username')::text, github_username),
    timezone = COALESCE((p_updates->>'timezone')::text, timezone),
    website = COALESCE((p_updates->>'website')::text, website),
    notification_preferences = COALESCE((p_updates->>'notification_preferences')::jsonb, notification_preferences),
    ui_preferences = COALESCE((p_updates->>'ui_preferences')::jsonb, ui_preferences),
    current_project_id = COALESCE((p_updates->>'current_project_id')::uuid, current_project_id),
    updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO updated_profile;

  -- Build complete profile response
  SELECT json_build_object(
    'profile', updated_profile,
    'projects', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'project', proj,
          'role', pm.role
        )
      )
      FROM project_members pm
      INNER JOIN projects proj ON pm.project_id = proj.id
      WHERE pm.user_id = p_user_id),
      '[]'::jsonb
    ),
    'current_project',
    (SELECT to_jsonb(p.*)
     FROM projects p
     WHERE p.id = updated_profile.current_project_id)
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_profile_data(UUID, JSONB) TO authenticated;