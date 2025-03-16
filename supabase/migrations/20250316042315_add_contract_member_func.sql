-- Migration file for contract member functions
-- Using 'CREATE OR REPLACE' and conditionally dropping functions to handle conflicts
-- We'll check for existing functions and drop them before creating new ones with different signatures

-- Check existing function signatures and drop if needed
DO $$ 
BEGIN
    -- For get_contract_by_milestone, drop only if it exists with a different signature
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_contract_by_milestone' 
        AND pg_get_function_result(oid) != 'jsonb'::regtype::text
    ) THEN
        DROP FUNCTION IF EXISTS public.get_contract_by_milestone;
    END IF;
END $$;

-- Function to add a member to a contract
CREATE OR REPLACE FUNCTION public.add_contract_member(
  p_contract_id TEXT,
  p_user_id TEXT,
  p_role TEXT DEFAULT 'member'
)
RETURNS JSONB AS $$
DECLARE
  v_member_count INTEGER;
  v_profile RECORD;
  v_result JSONB;
BEGIN
  -- Check if the contract exists
  IF NOT EXISTS (SELECT 1 FROM contracts WHERE id = p_contract_id) THEN
    RAISE EXCEPTION 'Contract not found' USING ERRCODE = 'P0002';
  END IF;

  -- Check if the user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  -- Check if the member is already part of the contract
  SELECT COUNT(*) INTO v_member_count 
  FROM contract_members 
  WHERE contract_id = p_contract_id AND user_id = p_user_id;
  
  IF v_member_count > 0 THEN
    RAISE EXCEPTION 'User is already a member of this contract' USING ERRCODE = 'P0001';
  END IF;

  -- Get user profile information
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  
  -- Insert the new contract member
  INSERT INTO contract_members (
    contract_id,
    user_id,
    role,
    joined_at
  ) VALUES (
    p_contract_id,
    p_user_id,
    p_role,
    NOW()
  );

  -- Create contract approval entry with default 'false' status
  INSERT INTO contract_approvals (
    contract_id,
    user_id,
    approval_type,
    approved,
    timestamp
  ) VALUES (
    p_contract_id,
    p_user_id,
    'completion',
    false,
    NOW()
  );

  -- Return contract data with updated members
  SELECT get_contract_by_id(p_contract_id) INTO v_result;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove a member from a contract
CREATE OR REPLACE FUNCTION public.remove_contract_member(
  p_contract_id TEXT,
  p_user_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_member_count INTEGER;
  v_result JSONB;
BEGIN
  -- Check if the contract exists
  IF NOT EXISTS (SELECT 1 FROM contracts WHERE id = p_contract_id) THEN
    RAISE EXCEPTION 'Contract not found' USING ERRCODE = 'P0002';
  END IF;

  -- Check if the member is part of the contract
  SELECT COUNT(*) INTO v_member_count 
  FROM contract_members 
  WHERE contract_id = p_contract_id AND user_id = p_user_id;
  
  IF v_member_count = 0 THEN
    RAISE EXCEPTION 'User is not a member of this contract' USING ERRCODE = 'P0001';
  END IF;

  -- Delete contract approval entries for this user and contract
  DELETE FROM contract_approvals 
  WHERE contract_id = p_contract_id AND user_id = p_user_id;

  -- Delete the contract member
  DELETE FROM contract_members 
  WHERE contract_id = p_contract_id AND user_id = p_user_id;

  -- Return contract data with updated members
  SELECT get_contract_by_id(p_contract_id) INTO v_result;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update a contract member's approval status
CREATE OR REPLACE FUNCTION public.update_contract_member_approval(
  p_contract_id TEXT,
  p_user_id TEXT,
  p_approved BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
  v_member_count INTEGER;
  v_result JSONB;
BEGIN
  -- Check if the contract exists
  IF NOT EXISTS (SELECT 1 FROM contracts WHERE id = p_contract_id) THEN
    RAISE EXCEPTION 'Contract not found' USING ERRCODE = 'P0002';
  END IF;

  -- Check if the member is part of the contract
  SELECT COUNT(*) INTO v_member_count 
  FROM contract_members 
  WHERE contract_id = p_contract_id AND user_id = p_user_id;
  
  IF v_member_count = 0 THEN
    RAISE EXCEPTION 'User is not a member of this contract' USING ERRCODE = 'P0001';
  END IF;

  -- Update the contract approval status
  UPDATE contract_approvals
  SET 
    approved = p_approved,
    timestamp = NOW()
  WHERE 
    contract_id = p_contract_id 
    AND user_id = p_user_id
    AND approval_type = 'completion';

  -- If no rows updated, insert a new record
  IF NOT FOUND THEN
    INSERT INTO contract_approvals (
      contract_id,
      user_id,
      approval_type,
      approved,
      timestamp
    ) VALUES (
      p_contract_id,
      p_user_id,
      'completion',
      p_approved,
      NOW()
    );
  END IF;

  -- Return contract data with updated members
  SELECT get_contract_by_id(p_contract_id) INTO v_result;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a contract by ID with its members
CREATE OR REPLACE FUNCTION public.get_contract_by_id(
  p_contract_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_contract RECORD;
  v_contract_json JSONB;
  v_members JSONB;
  v_result JSONB;
BEGIN
  -- Check if the contract exists
  SELECT * INTO v_contract FROM contracts WHERE id = p_contract_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found' USING ERRCODE = 'P0002';
  END IF;

  -- Convert contract to JSON
  v_contract_json = to_jsonb(v_contract);

  -- Get contract members with approval status and profile info
  SELECT json_agg(
    jsonb_build_object(
      'id', p.id,
      'display_name', p.display_name,
      'email', p.email,
      'avatar_url', p.avatar_url,
      'role', cm.role,
      'hasApproved', COALESCE(ca.approved, FALSE)
    )
  ) INTO v_members
  FROM contract_members cm
  JOIN profiles p ON cm.user_id = p.id
  LEFT JOIN contract_approvals ca ON 
    ca.contract_id = cm.contract_id AND 
    ca.user_id = cm.user_id AND
    ca.approval_type = 'completion'
  WHERE cm.contract_id = p_contract_id;

  -- Build the result
  v_result = jsonb_build_object(
    'contract', v_contract_json,
    'members', COALESCE(v_members, '[]'::jsonb)
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing get_contract_by_milestone function to use the new format
-- Function already dropped at the beginning of the script
CREATE FUNCTION public.get_contract_by_milestone(
  p_milestone_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_contract_id TEXT;
  v_result JSONB;
BEGIN
  -- Find the contract ID associated with this milestone
  SELECT c.id INTO v_contract_id
  FROM contracts c
  JOIN milestones m ON m.project_id = c.project_id
  WHERE m.id = p_milestone_id
  LIMIT 1;
  
  IF v_contract_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Use the get_contract_by_id function to get the contract with members
  SELECT get_contract_by_id(v_contract_id) INTO v_result;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant required permissions
-- Using IF EXISTS to prevent errors if the function doesn't exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'add_contract_member') THEN
        GRANT EXECUTE ON FUNCTION public.add_contract_member TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'remove_contract_member') THEN
        GRANT EXECUTE ON FUNCTION public.remove_contract_member TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_contract_member_approval') THEN
        GRANT EXECUTE ON FUNCTION public.update_contract_member_approval TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_contract_by_id') THEN
        GRANT EXECUTE ON FUNCTION public.get_contract_by_id TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_contract_by_milestone') THEN
        GRANT EXECUTE ON FUNCTION public.get_contract_by_milestone TO authenticated;
    END IF;
END $$;