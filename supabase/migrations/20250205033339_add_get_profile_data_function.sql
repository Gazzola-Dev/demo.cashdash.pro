-- Create function to get profile data with enriched project data
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

  -- Get profile data with joined project data
  SELECT 
    jsonb_build_object(
      'profile', p,
      'current_project', CASE 
        WHEN p.current_project_id IS NOT NULL THEN 
          (SELECT proj FROM projects proj WHERE proj.id = p.current_project_id)
        ELSE NULL
      END,
      'projects', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'project', proj,
            'role', pm.role
          )
        ) FILTER (WHERE proj.id IS NOT NULL),
        '[]'::jsonb
      )
    )::json INTO result
  FROM profiles p
  LEFT JOIN project_members pm ON p.id = pm.user_id
  LEFT JOIN projects proj ON pm.project_id = proj.id
  WHERE p.id = auth.uid()
  GROUP BY p.id, p.current_project_id;

  -- Return the result
  RETURN result;
END;
$$;