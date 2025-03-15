-- Create function to get contract with members after updating
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
  -- Update the contract
  UPDATE contracts
  SET
    title = COALESCE(p_updates->>'title', title),
    description = COALESCE(p_updates->>'description', description),
    total_amount_cents = COALESCE((p_updates->>'total_amount_cents')::integer, total_amount_cents),
    client_name = COALESCE(p_updates->>'client_name', client_name),
    client_company = COALESCE(p_updates->>'client_company', client_company),
    start_date = COALESCE((p_updates->>'start_date')::timestamptz, start_date),
    end_date = COALESCE((p_updates->>'end_date')::timestamptz, end_date),
    updated_at = now()
  WHERE id = p_contract_id
  RETURNING * INTO updated_contract;
  
  -- Get the contract with its members
  SELECT
    jsonb_build_object(
      'contract', to_jsonb(c.*),
      'members', COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', cm.user_id,
            'display_name', p.display_name,
            'email', p.email,
            'avatar_url', p.avatar_url,
            'role', cm.role,
            'hasApproved', EXISTS (
              SELECT 1 FROM contract_approvals ca 
              WHERE ca.contract_id = c.id AND ca.user_id = cm.user_id AND ca.approved = true
            )
          )
        ) FILTER (WHERE cm.id IS NOT NULL),
        '[]'::jsonb
      )
    )::json INTO result
  FROM contracts c
  LEFT JOIN contract_members cm ON c.id = cm.contract_id
  LEFT JOIN profiles p ON cm.user_id = p.id
  WHERE c.id = updated_contract.id
  GROUP BY c.id;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_contract_with_members(UUID, JSONB) TO authenticated;