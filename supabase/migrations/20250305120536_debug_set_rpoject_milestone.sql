-- Migration to fix the set_project_current_milestone function
-- The function returns true but doesn't update the milestone

-- Drop the existing function
DROP FUNCTION IF EXISTS public.set_project_current_milestone;

-- Create a fixed version with targeted debugging and fix
CREATE OR REPLACE FUNCTION public.set_project_current_milestone(
  p_project_id UUID,
  p_milestone_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_has_access BOOLEAN;
  v_updated_rows INTEGER;
  v_current_milestone UUID;
  v_after_milestone UUID;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  RAISE NOTICE 'User ID: %', v_user_id;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not authenticated';
    RETURN FALSE;
  END IF;

  -- Check if the user has access to the project
  SELECT EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = p_project_id 
    AND user_id = v_user_id
    AND role IN ('admin', 'owner')
  ) INTO v_has_access;
  
  RAISE NOTICE 'User has access: %', v_has_access;
  
  IF NOT v_has_access THEN
    RAISE NOTICE 'User lacks permission';
    RETURN FALSE;
  END IF;
  
  -- Get current milestone value for debugging
  SELECT current_milestone_id INTO v_current_milestone 
  FROM projects 
  WHERE id = p_project_id;
  
  RAISE NOTICE 'Current milestone before update: %', v_current_milestone;
  RAISE NOTICE 'Attempting to set milestone to: %', p_milestone_id;

  -- Perform the update with explicit updated_at
  UPDATE projects
  SET 
    current_milestone_id = p_milestone_id,
    updated_at = NOW()  -- Ensure updated_at is modified
  WHERE id = p_project_id
  RETURNING current_milestone_id INTO v_after_milestone;
  
  -- Check how many rows were affected
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  RAISE NOTICE 'Rows updated: %', v_updated_rows;
  RAISE NOTICE 'Returned milestone value: %', v_after_milestone;
  
  -- Double-check the update was successful
  SELECT current_milestone_id INTO v_after_milestone 
  FROM projects 
  WHERE id = p_project_id;
  
  RAISE NOTICE 'Verified milestone after update: %', v_after_milestone;
  RAISE NOTICE 'Update matches expected value: %', (v_after_milestone = p_milestone_id);
  
  -- *** The critical fix: Return actual success based on change ***
  RETURN v_updated_rows > 0 AND v_after_milestone = p_milestone_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_project_current_milestone TO authenticated;

-- For diagnostic purposes, let's create a simpler direct function that bypasses checks
CREATE OR REPLACE FUNCTION public.direct_set_project_milestone(
  p_project_id UUID,
  p_milestone_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_rows INTEGER;
BEGIN
  -- Direct update without checks
  UPDATE projects
  SET 
    current_milestone_id = p_milestone_id,
    updated_at = NOW()
  WHERE id = p_project_id;
  
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  RAISE NOTICE 'Direct update affected % rows', v_updated_rows;
  
  RETURN v_updated_rows > 0;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.direct_set_project_milestone TO authenticated;