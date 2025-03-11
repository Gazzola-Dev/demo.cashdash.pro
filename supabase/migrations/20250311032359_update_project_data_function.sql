-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.update_project_data;

-- Create the updated function with all project fields
CREATE OR REPLACE FUNCTION public.update_project_data(
  p_project_id UUID,
  p_updates JSONB,
  p_user_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  project_exists boolean;
  has_permission boolean;
BEGIN
  -- First check if the project exists
  SELECT EXISTS(SELECT 1 FROM projects WHERE id = p_project_id) INTO project_exists;
  
  IF NOT project_exists THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  
  -- Check if the user has permission to update this project
  SELECT EXISTS(
    SELECT 1 FROM project_members 
    WHERE project_id = p_project_id
    AND user_id = p_user_id
    AND role IN ('admin', 'owner')
  ) INTO has_permission;
  
  IF NOT has_permission THEN
    RAISE EXCEPTION 'You do not have permission to update this project';
  END IF;
  
  -- Update the project with the provided fields
  UPDATE projects
  SET
    name = COALESCE(p_updates->>'name', name),
    description = COALESCE(p_updates->>'description', description),
    slug = CASE
      WHEN p_updates->>'name' IS NOT NULL AND (p_updates->>'slug' IS NULL OR p_updates->>'slug' = '')
      THEN generate_unique_slug(to_kebab_case(p_updates->>'name'), 'projects', p_project_id)
      WHEN p_updates->>'slug' IS NOT NULL AND p_updates->>'slug' != ''
      THEN p_updates->>'slug'
      ELSE slug
    END,
    prefix = COALESCE(p_updates->>'prefix', prefix),
    github_repo_url = COALESCE(p_updates->>'github_repo_url', github_repo_url),
    github_owner = COALESCE(p_updates->>'github_owner', github_owner),
    github_repo = COALESCE(p_updates->>'github_repo', github_repo),
    icon_name = COALESCE(p_updates->>'icon_name', icon_name),
    icon_color_fg = COALESCE(p_updates->>'icon_color_fg', icon_color_fg),
    icon_color_bg = COALESCE(p_updates->>'icon_color_bg', icon_color_bg),
    status = COALESCE((p_updates->>'status')::project_status, status),
    subscription_status = COALESCE((p_updates->>'subscription_status')::subscription_status, subscription_status),
    current_milestone_id = COALESCE((p_updates->>'current_milestone_id')::uuid, current_milestone_id),
    updated_at = NOW()
  WHERE id = p_project_id
  RETURNING row_to_json(projects) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_project_data TO authenticated;