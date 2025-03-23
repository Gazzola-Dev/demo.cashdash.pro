-- Create function to get project name by ID with proper RLS enforcement
CREATE OR REPLACE FUNCTION public.get_project_name_by_id(p_project_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_name TEXT;
  v_user_id UUID := auth.uid();
BEGIN
  -- Check if the user has access to the project
  IF NOT EXISTS (
    SELECT 1 
    FROM project_members 
    WHERE project_id = p_project_id 
    AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied: User is not a member of this project';
  END IF;

  -- Get the project name
  SELECT name INTO v_project_name
  FROM projects
  WHERE id = p_project_id;

  RETURN v_project_name;
END;
$$;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_project_name_by_id(UUID) TO authenticated;