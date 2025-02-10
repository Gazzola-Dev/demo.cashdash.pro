CREATE OR REPLACE FUNCTION public.set_user_current_project(
  p_user_id UUID,
  p_project_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET current_project_id = p_project_id
  WHERE id = p_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_user_current_project(UUID, UUID) TO authenticated;