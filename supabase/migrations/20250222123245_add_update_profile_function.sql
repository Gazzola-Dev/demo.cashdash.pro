-- Create or replace the update_profile_data function
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
  found_profile profiles;
BEGIN
  -- Check authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check authorization
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get the profile
  SELECT * INTO found_profile
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Update the profile with the provided values
  UPDATE profiles
  SET
    display_name = COALESCE(
      (p_updates->>'display_name')::text,
      display_name
    ),
    avatar_url = COALESCE(
      (p_updates->>'avatar_url')::text,
      avatar_url
    ),
    professional_title = COALESCE(
      (p_updates->>'professional_title')::text,
      professional_title
    ),
    bio = COALESCE(
      (p_updates->>'bio')::text,
      bio
    ),
    github_username = COALESCE(
      (p_updates->>'github_username')::text,
      github_username
    ),
    timezone = COALESCE(
      (p_updates->>'timezone')::text,
      timezone
    ),
    website = COALESCE(
      (p_updates->>'website')::text,
      website
    ),
    notification_preferences = COALESCE(
      (p_updates->>'notification_preferences')::jsonb,
      notification_preferences
    ),
    ui_preferences = COALESCE(
      (p_updates->>'ui_preferences')::jsonb,
      ui_preferences
    ),
    updated_at = now()
  WHERE id = p_user_id
  RETURNING row_to_json(profiles.*) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_profile_data TO authenticated;