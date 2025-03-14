-- Create function to get contract details by milestone ID
CREATE OR REPLACE FUNCTION public.get_contract_by_milestone(
  p_milestone_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  v_project_id UUID; -- Move the declaration to the main DECLARE block
BEGIN
  IF p_milestone_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- First get the milestone to find the project_id
  SELECT project_id INTO v_project_id
  FROM milestones
  WHERE id = p_milestone_id;
  
  IF v_project_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the contract with members
  SELECT
    jsonb_build_object(
      'contract', c,
      'members', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'display_name', p.display_name,
            'email', p.email,
            'avatar_url', p.avatar_url,
            'role', cm.role
          )
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'::jsonb
      )
    )::json INTO result
  FROM contracts c
  LEFT JOIN contract_members cm ON c.id = cm.contract_id
  LEFT JOIN profiles p ON cm.user_id = p.id
  WHERE c.project_id = v_project_id
  GROUP BY c.id
  ORDER BY c.created_at DESC
  LIMIT 1;
  
  RETURN result;
END;
$$;

-- Create or replace trigger function to automatically add project managers as contract members
CREATE OR REPLACE FUNCTION public.auto_populate_contract_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Get the project ID
  v_project_id := NEW.project_id;
  
  -- Insert project managers as contract members with appropriate roles
  INSERT INTO contract_members (
    contract_id,
    user_id,
    role,
    joined_at
  )
  SELECT 
    NEW.id,
    pm.user_id,
    CASE 
      WHEN pm.role = 'owner' THEN 'admin'
      WHEN pm.role = 'admin' THEN 'project_manager'
      ELSE 'developer' 
    END,
    NOW()
  FROM project_members pm
  WHERE pm.project_id = v_project_id
  AND pm.role IN ('owner', 'admin', 'pm') -- Only include project managers and admins
  ON CONFLICT (contract_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Add trigger to automatically populate contract members when a contract is created
DROP TRIGGER IF EXISTS contracts_auto_populate_members ON public.contracts;
CREATE TRIGGER contracts_auto_populate_members
AFTER INSERT ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.auto_populate_contract_members();

-- Grant execute permissions to the new function
GRANT EXECUTE ON FUNCTION public.get_contract_by_milestone(UUID) TO authenticated;