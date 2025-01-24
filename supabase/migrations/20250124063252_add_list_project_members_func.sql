CREATE OR REPLACE FUNCTION public.list_project_members(project_slug text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_project projects;
  member_count INTEGER;
  diagnostic_data jsonb;
BEGIN
  -- First get the project to verify it exists and capture ID
  SELECT * INTO found_project 
  FROM projects 
  WHERE slug = project_slug;
  
  -- Get count of members for this project
  SELECT COUNT(*) INTO member_count 
  FROM project_members 
  WHERE project_id = found_project.id;
  
  -- Build diagnostic data
  diagnostic_data := jsonb_build_object(
    'debug_info', jsonb_build_object(
      'project_exists', found_project IS NOT NULL,
      'project_id', found_project.id,
      'project_slug', project_slug,
      'member_count', member_count,
      'timestamp', now(),
      'calling_user', current_user
    )
  );

  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'member', pm,
      'project', p,
      'profile', prof,
      'debug', diagnostic_data
    )::json
  FROM project_members pm
  INNER JOIN projects p ON pm.project_id = p.id
  LEFT JOIN profiles prof ON pm.user_id = prof.id
  WHERE p.slug = project_slug;

  -- If no rows were returned, return just the diagnostic data
  IF NOT FOUND THEN
    RETURN NEXT (jsonb_build_object('debug', diagnostic_data))::json;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.list_project_members(TEXT) TO authenticated;