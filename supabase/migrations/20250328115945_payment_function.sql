-- Drop all existing versions of the function with their specific argument lists
DROP FUNCTION IF EXISTS public.confirm_contract_payment(TEXT, UUID);
DROP FUNCTION IF EXISTS public.confirm_contract_payment(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.confirm_contract_payment(TEXT, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.confirm_contract_payment(TEXT, UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.confirm_contract_payment(TEXT, UUID, UUID, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.confirm_contract_payment(TEXT, UUID, UUID, TEXT, TEXT, INTEGER, UUID);

-- Create function to handle contract payment confirmation with proper error handling
CREATE OR REPLACE FUNCTION public.confirm_contract_payment(
  p_payment_intent_id TEXT,
  p_user_id UUID,
  p_project_id UUID DEFAULT NULL,
  p_transaction_id TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'stripe',
  p_amount_cents INTEGER DEFAULT NULL,
  p_milestone_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_record_id UUID;
  v_contract_id UUID;
  v_contract_amount INTEGER;
  v_updated_milestone BOOLEAN := false;
  v_result JSON;
  v_error TEXT;
BEGIN
  -- Verify the user is authenticated
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- If projectId is provided, verify the user is a member of this project
  IF p_project_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM project_members
      WHERE project_id = p_project_id
      AND user_id = p_user_id
    ) THEN
      RAISE EXCEPTION 'You must be a member of the project to process payments';
    END IF;

    -- Find the associated contract for this project and get its amount
    SELECT id, total_amount_cents INTO v_contract_id, v_contract_amount
    FROM contracts
    WHERE project_id = p_project_id
    LIMIT 1;

    IF v_contract_id IS NULL THEN
      RAISE EXCEPTION 'No contract found for this project';
    END IF;
  END IF;

  -- Use the contract amount regardless of whether an amount was provided
  -- If provided amount doesn't match, we'll ignore it and use contract amount
  
  -- Store payment details in contract_payments
  INSERT INTO contract_payments(
    contract_id,
    amount_cents,
    payer_id,
    status,
    payment_id,
    payment_date,
    payment_method,
    transaction_id,
    milestone_id
  ) VALUES (
    v_contract_id,
    v_contract_amount, -- Always use the contract amount
    p_user_id,
    'completed',
    p_payment_intent_id,
    NOW(),
    p_payment_method,
    COALESCE(p_transaction_id, p_payment_intent_id),
    p_milestone_id
  )
  RETURNING id INTO v_payment_record_id;

  -- If this payment is for a milestone, update the milestone status to active
  IF p_milestone_id IS NOT NULL THEN
    UPDATE contract_milestones
    SET status = 'active'
    WHERE id = p_milestone_id
    AND status != 'active';
    
    IF FOUND THEN
      v_updated_milestone := true;
    END IF;
  END IF;

  -- Return success response with details in data field
  v_result := json_build_object(
    'data', json_build_object(
      'success', true,
      'payment_record_id', v_payment_record_id,
      'amount', v_contract_amount,
      'contract_id', v_contract_id,
      'transaction_id', COALESCE(p_transaction_id, p_payment_intent_id),
      'milestone_updated', v_updated_milestone,
      'milestone_id', p_milestone_id
    ),
    'error', NULL
  );
  
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Return error response with error in error field and null data
  v_error := SQLERRM;
  
  v_result := json_build_object(
    'data', NULL,
    'error', v_error
  );
  
  RETURN v_result;
END;
$$;

-- Update security policy to grant execute permission
GRANT EXECUTE ON FUNCTION public.confirm_contract_payment(TEXT, UUID, UUID, TEXT, TEXT, INTEGER, UUID) TO authenticated;