-- Migration to update contract-related functions to return data in ContractWithMembers shape
-- This migration updates the existing functions to include the payments array

-- First, modify the get_contract_by_id function to include payments
CREATE OR REPLACE FUNCTION public.get_contract_by_id(
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
  -- Get contract with members and payments data
  SELECT 
    jsonb_build_object(
      'id', c.id,
      'project_id', c.project_id,
      'title', c.title,
      'description', c.description,
      'total_amount_cents', c.total_amount_cents,
      'currency', c.currency,
      'status', c.status,
      'client_name', c.client_name,
      'client_company', c.client_company,
      'start_date', c.start_date,
      'end_date', c.end_date,
      'created_at', c.created_at,
      'updated_at', c.updated_at,
      'upwork_contract_id', c.upwork_contract_id,
      'members', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'display_name', p.display_name,
            'email', p.email,
            'avatar_url', p.avatar_url,
            'role', cm.role,
            'hasApproved', COALESCE(ca.approved, false)
          )
        ) FILTER (WHERE cm.id IS NOT NULL),
        '[]'::jsonb
      ),
      'payments', COALESCE(
        (SELECT 
          jsonb_agg(
            jsonb_build_object(
              'id', cp.id,
              'contract_id', cp.contract_id,
              'amount_cents', cp.amount_cents,
              'status', cp.status,
              'created_at', cp.created_at,
              'updated_at', cp.updated_at,
              'payment_date', cp.payment_date,
              'payment_method', cp.payment_method,
              'transaction_id', cp.transaction_id,
              'payment_id', cp.payment_id,
              'payer_id', cp.payer_id,
              'payee_id', cp.payee_id,
              'milestone_id', cp.milestone_id
            )
          )
         FROM contract_payments cp
         WHERE cp.contract_id = c.id
        ),
        '[]'::jsonb
      )
    )::json INTO result
  FROM contracts c
  LEFT JOIN contract_members cm ON c.id = cm.contract_id
  LEFT JOIN profiles p ON cm.user_id = p.id
  LEFT JOIN contract_approvals ca ON c.id = ca.contract_id AND cm.user_id = ca.user_id AND ca.approval_type = 'completion'
  WHERE c.id = p_contract_id
  GROUP BY c.id;

  RETURN result;
END;
$$;

-- Update the get_contract_by_milestone function to include payments
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
  v_contract_id UUID;
BEGIN
  -- First find the contract related to this milestone
  SELECT c.id INTO v_contract_id
  FROM contracts c
  JOIN milestones m ON c.project_id = m.project_id
  WHERE m.id = p_milestone_id;
  
  -- If no contract found, return null
  IF v_contract_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get contract with members and payments data using the same format as get_contract_by_id
  SELECT 
    jsonb_build_object(
      'id', c.id,
      'project_id', c.project_id,
      'title', c.title,
      'description', c.description,
      'total_amount_cents', c.total_amount_cents,
      'currency', c.currency,
      'status', c.status,
      'client_name', c.client_name,
      'client_company', c.client_company,
      'start_date', c.start_date,
      'end_date', c.end_date,
      'created_at', c.created_at,
      'updated_at', c.updated_at,
      'upwork_contract_id', c.upwork_contract_id,
      'members', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'display_name', p.display_name,
            'email', p.email,
            'avatar_url', p.avatar_url,
            'role', cm.role,
            'hasApproved', COALESCE(ca.approved, false)
          )
        ) FILTER (WHERE cm.id IS NOT NULL),
        '[]'::jsonb
      ),
      'payments', COALESCE(
        (SELECT 
          jsonb_agg(
            jsonb_build_object(
              'id', cp.id,
              'contract_id', cp.contract_id,
              'amount_cents', cp.amount_cents,
              'status', cp.status,
              'created_at', cp.created_at,
              'updated_at', cp.updated_at,
              'payment_date', cp.payment_date,
              'payment_method', cp.payment_method,
              'transaction_id', cp.transaction_id,
              'payment_id', cp.payment_id,
              'payer_id', cp.payer_id,
              'payee_id', cp.payee_id,
              'milestone_id', cp.milestone_id
            )
          )
         FROM contract_payments cp
         WHERE cp.contract_id = c.id
        ),
        '[]'::jsonb
      )
    )::json INTO result
  FROM contracts c
  LEFT JOIN contract_members cm ON c.id = cm.contract_id
  LEFT JOIN profiles p ON cm.user_id = p.id
  LEFT JOIN contract_approvals ca ON c.id = ca.contract_id AND cm.user_id = ca.user_id AND ca.approval_type = 'completion'
  WHERE c.id = v_contract_id
  GROUP BY c.id;

  RETURN result;
END;
$$;

-- Update the update_contract_with_members function to include payments
CREATE OR REPLACE FUNCTION public.update_contract_with_members(
  p_contract_id UUID,
  p_updates JSONB
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_contract contracts;
  result json;
BEGIN
  -- Update the contract with provided updates
  UPDATE contracts
  SET
    title = COALESCE(p_updates->>'title', title),
    description = COALESCE(p_updates->>'description', description),
    total_amount_cents = COALESCE((p_updates->>'total_amount_cents')::integer, total_amount_cents),
    currency = COALESCE(p_updates->>'currency', currency),
    status = COALESCE((p_updates->>'status')::contract_status, status),
    client_name = COALESCE(p_updates->>'client_name', client_name),
    client_company = COALESCE(p_updates->>'client_company', client_company),
    start_date = COALESCE((p_updates->>'start_date')::timestamptz, start_date),
    end_date = COALESCE((p_updates->>'end_date')::timestamptz, end_date),
    upwork_contract_id = COALESCE(p_updates->>'upwork_contract_id', upwork_contract_id),
    updated_at = now()
  WHERE id = p_contract_id
  RETURNING * INTO updated_contract;

  -- Get the updated contract with members and payments using the same format
  SELECT 
    jsonb_build_object(
      'id', c.id,
      'project_id', c.project_id,
      'title', c.title,
      'description', c.description,
      'total_amount_cents', c.total_amount_cents,
      'currency', c.currency,
      'status', c.status,
      'client_name', c.client_name,
      'client_company', c.client_company,
      'start_date', c.start_date,
      'end_date', c.end_date,
      'created_at', c.created_at,
      'updated_at', c.updated_at,
      'upwork_contract_id', c.upwork_contract_id,
      'members', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'display_name', p.display_name,
            'email', p.email,
            'avatar_url', p.avatar_url,
            'role', cm.role,
            'hasApproved', COALESCE(ca.approved, false)
          )
        ) FILTER (WHERE cm.id IS NOT NULL),
        '[]'::jsonb
      ),
      'payments', COALESCE(
        (SELECT 
          jsonb_agg(
            jsonb_build_object(
              'id', cp.id,
              'contract_id', cp.contract_id,
              'amount_cents', cp.amount_cents,
              'status', cp.status,
              'created_at', cp.created_at,
              'updated_at', cp.updated_at,
              'payment_date', cp.payment_date,
              'payment_method', cp.payment_method,
              'transaction_id', cp.transaction_id,
              'payment_id', cp.payment_id,
              'payer_id', cp.payer_id,
              'payee_id', cp.payee_id,
              'milestone_id', cp.milestone_id
            )
          )
         FROM contract_payments cp
         WHERE cp.contract_id = c.id
        ),
        '[]'::jsonb
      )
    )::json INTO result
  FROM contracts c
  LEFT JOIN contract_members cm ON c.id = cm.contract_id
  LEFT JOIN profiles p ON cm.user_id = p.id
  LEFT JOIN contract_approvals ca ON c.id = ca.contract_id AND cm.user_id = ca.user_id AND ca.approval_type = 'completion'
  WHERE c.id = updated_contract.id
  GROUP BY c.id;

  RETURN result;
END;
$$;

-- Update the toggleContractMemberAction function to include payments
CREATE OR REPLACE FUNCTION public.togglecontractmemberaction(
  p_contract_id UUID,
  p_user_id UUID,
  p_role TEXT DEFAULT 'developer'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contract_member contract_members;
  result json;
BEGIN
  -- Check if the member already exists
  SELECT * INTO contract_member
  FROM contract_members
  WHERE contract_id = p_contract_id AND user_id = p_user_id;
  
  IF contract_member IS NULL THEN
    -- Add the member if they don't exist
    -- Cast text input to contract_member_role type
    INSERT INTO contract_members (contract_id, user_id, role, joined_at)
    VALUES (p_contract_id, p_user_id, p_role::contract_member_role, NOW());
    
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
    )
    ON CONFLICT (contract_id, user_id, approval_type) DO NOTHING;
  ELSE
    -- Remove the member if they exist
    DELETE FROM contract_members
    WHERE contract_id = p_contract_id AND user_id = p_user_id;
    
    -- Delete related approval records
    DELETE FROM contract_approvals
    WHERE contract_id = p_contract_id AND user_id = p_user_id;
  END IF;
  
  -- Return the updated contract with members and payments
  SELECT 
    jsonb_build_object(
      'id', c.id,
      'project_id', c.project_id,
      'title', c.title,
      'description', c.description,
      'total_amount_cents', c.total_amount_cents,
      'currency', c.currency,
      'status', c.status,
      'client_name', c.client_name,
      'client_company', c.client_company,
      'start_date', c.start_date,
      'end_date', c.end_date,
      'created_at', c.created_at,
      'updated_at', c.updated_at,
      'upwork_contract_id', c.upwork_contract_id,
      'members', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'display_name', p.display_name,
            'email', p.email,
            'avatar_url', p.avatar_url,
            'role', cm.role,
            'hasApproved', COALESCE(ca.approved, false)
          )
        ) FILTER (WHERE cm.id IS NOT NULL),
        '[]'::jsonb
      ),
      'payments', COALESCE(
        (SELECT 
          jsonb_agg(
            jsonb_build_object(
              'id', cp.id,
              'contract_id', cp.contract_id,
              'amount_cents', cp.amount_cents,
              'status', cp.status,
              'created_at', cp.created_at,
              'updated_at', cp.updated_at,
              'payment_date', cp.payment_date,
              'payment_method', cp.payment_method,
              'transaction_id', cp.transaction_id,
              'payment_id', cp.payment_id,
              'payer_id', cp.payer_id,
              'payee_id', cp.payee_id,
              'milestone_id', cp.milestone_id
            )
          )
         FROM contract_payments cp
         WHERE cp.contract_id = c.id
        ),
        '[]'::jsonb
      )
    )::json INTO result
  FROM contracts c
  LEFT JOIN contract_members cm ON c.id = cm.contract_id
  LEFT JOIN profiles p ON cm.user_id = p.id
  LEFT JOIN contract_approvals ca ON c.id = ca.contract_id AND cm.user_id = ca.user_id AND ca.approval_type = 'completion'
  WHERE c.id = p_contract_id
  GROUP BY c.id;

  RETURN result;
END;
$$;

-- Update the update_contract_member_approval function to include payments
CREATE OR REPLACE FUNCTION public.update_contract_member_approval(
  p_contract_id UUID,
  p_user_id UUID,
  p_approved BOOLEAN
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
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
    
  -- Return the updated contract with members and payments
  SELECT 
    jsonb_build_object(
      'id', c.id,
      'project_id', c.project_id,
      'title', c.title,
      'description', c.description,
      'total_amount_cents', c.total_amount_cents,
      'currency', c.currency,
      'status', c.status,
      'client_name', c.client_name,
      'client_company', c.client_company,
      'start_date', c.start_date,
      'end_date', c.end_date,
      'created_at', c.created_at,
      'updated_at', c.updated_at,
      'upwork_contract_id', c.upwork_contract_id,
      'members', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'display_name', p.display_name,
            'email', p.email,
            'avatar_url', p.avatar_url,
            'role', cm.role,
            'hasApproved', COALESCE(ca.approved, false)
          )
        ) FILTER (WHERE cm.id IS NOT NULL),
        '[]'::jsonb
      ),
      'payments', COALESCE(
        (SELECT 
          jsonb_agg(
            jsonb_build_object(
              'id', cp.id,
              'contract_id', cp.contract_id,
              'amount_cents', cp.amount_cents,
              'status', cp.status,
              'created_at', cp.created_at,
              'updated_at', cp.updated_at,
              'payment_date', cp.payment_date,
              'payment_method', cp.payment_method,
              'transaction_id', cp.transaction_id,
              'payment_id', cp.payment_id,
              'payer_id', cp.payer_id,
              'payee_id', cp.payee_id,
              'milestone_id', cp.milestone_id
            )
          )
         FROM contract_payments cp
         WHERE cp.contract_id = c.id
        ),
        '[]'::jsonb
      )
    )::json INTO result
  FROM contracts c
  LEFT JOIN contract_members cm ON c.id = cm.contract_id
  LEFT JOIN profiles p ON cm.user_id = p.id
  LEFT JOIN contract_approvals ca ON c.id = ca.contract_id AND cm.user_id = ca.user_id AND ca.approval_type = 'completion'
  WHERE c.id = p_contract_id
  GROUP BY c.id;

  RETURN result;
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_contract_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contract_by_milestone(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_contract_with_members(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.togglecontractmemberaction(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_contract_member_approval(UUID, UUID, BOOLEAN) TO authenticated;