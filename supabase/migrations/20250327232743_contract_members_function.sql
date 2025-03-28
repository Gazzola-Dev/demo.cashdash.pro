-- Create contract_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contract_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contract_id, user_id)
);

-- Create contract_approvals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contract_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approval_type approval_type NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contract_id, user_id, approval_type)
);

-- First, drop the existing function to avoid the return type error
DROP FUNCTION IF EXISTS public.add_contract_member;

-- Create function to add a member to a contract
CREATE FUNCTION public.add_contract_member(
  p_contract_id UUID,
  p_user_id UUID,
  p_role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
END;
$$;

-- First, drop the existing function
DROP FUNCTION IF EXISTS public.remove_contract_member;

-- Create function to remove a member from a contract
CREATE FUNCTION public.remove_contract_member(
  p_contract_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete contract member record
  DELETE FROM contract_members
  WHERE contract_id = p_contract_id AND user_id = p_user_id;
  
  -- Delete related approval records
  DELETE FROM contract_approvals
  WHERE contract_id = p_contract_id AND user_id = p_user_id;
END;
$$;

-- First, drop the existing function
DROP FUNCTION IF EXISTS public.update_contract_member_approval;

-- Create function to update a contract member's approval status
CREATE FUNCTION public.update_contract_member_approval(
  p_contract_id UUID,
  p_user_id UUID,
  p_approved BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update approval status for the contract member
  UPDATE contract_approvals
  SET 
    approved = p_approved,
    timestamp = NOW()
  WHERE 
    contract_id = p_contract_id 
    AND user_id = p_user_id
    AND approval_type = 'completion';
END;
$$;

-- First, drop the existing function
DROP FUNCTION IF EXISTS public.get_contract_by_id;

-- Create function to get a contract by ID with all its members
CREATE FUNCTION public.get_contract_by_id(
  p_contract_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT 
    json_build_object(
      'contract', row_to_json(c),
      'members', (
        SELECT 
          json_agg(
            json_build_object(
              'id', cm.user_id,
              'role', cm.role,
              'hasApproved', COALESCE(ca.approved, false),
              'display_name', p.display_name,
              'email', p.email,
              'avatar_url', p.avatar_url
            )
          )
        FROM contract_members cm
        LEFT JOIN contract_approvals ca ON 
          cm.contract_id = ca.contract_id 
          AND cm.user_id = ca.user_id
          AND ca.approval_type = 'completion'
        LEFT JOIN profiles p ON cm.user_id = p.id
        WHERE cm.contract_id = p_contract_id
      )
    ) INTO result
  FROM contracts c
  WHERE c.id = p_contract_id;

  RETURN result;
END;
$$;

-- Enable RLS on the new tables
ALTER TABLE public.contract_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_approvals ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create RLS policy for contract_members
DROP POLICY IF EXISTS "Contract members are viewable by project members" ON contract_members;

CREATE POLICY "Contract members are viewable by project members" ON contract_members
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM contracts c
        JOIN project_members pm ON c.project_id = pm.project_id
        WHERE c.id = contract_members.contract_id
        AND pm.user_id = auth.uid()
    )
);

-- Drop existing policy if it exists, then create RLS policy for contract_approvals
DROP POLICY IF EXISTS "Contract approvals are viewable by project members" ON contract_approvals;

CREATE POLICY "Contract approvals are viewable by project members" ON contract_approvals
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM contracts c
        JOIN project_members pm ON c.project_id = pm.project_id
        WHERE c.id = contract_approvals.contract_id
        AND pm.user_id = auth.uid()
    )
);

-- Drop existing policy if it exists, then create RLS policy for modify actions
DROP POLICY IF EXISTS "Contract approvals are modifiable by self" ON contract_approvals;

CREATE POLICY "Contract approvals are modifiable by self" ON contract_approvals
FOR UPDATE
USING (
    user_id = auth.uid()
);

-- Grant permissions to authenticated users
GRANT ALL ON public.contract_members TO authenticated;
GRANT ALL ON public.contract_approvals TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_contract_member(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_contract_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_contract_member_approval(UUID, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contract_by_id(UUID) TO authenticated;