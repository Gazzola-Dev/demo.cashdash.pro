-- Create function to handle new milestone creation and link it to a contract
CREATE OR REPLACE FUNCTION public.handle_new_milestone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_default_contract_id UUID;
BEGIN
  -- Get the project ID from the new milestone
  v_project_id := NEW.project_id;
  
  -- Always create a new contract for each milestone
  INSERT INTO contracts (
    project_id,
    upwork_contract_id,
    title,
    description,
    total_amount_cents,
    currency,
    status,
    client_name,
    start_date
  ) VALUES (
    v_project_id,
    'auto-' || gen_random_uuid(),
    NEW.title || ' Contract', -- Default to milestone name + ' Contract'
    'Automatically created contract for milestone tracking.',
    NEW.payment_cents,
    'USD',
    'active',
    'System Generated',
    CURRENT_TIMESTAMP
  ) RETURNING id INTO v_default_contract_id;
  
  -- Only auto-populate project managers from project members
  INSERT INTO contract_members (
    contract_id,
    user_id,
    role,
    joined_at
  )
  SELECT 
    v_default_contract_id,
    pm.user_id,
    pm.role,
    NOW()
  FROM 
    project_members pm
  WHERE 
    pm.project_id = v_project_id 
    AND pm.role = 'pm'; -- Only include project managers
  
  -- Create a contract milestone that matches this milestone
  INSERT INTO contract_milestones (
    contract_id,
    title,
    amount_cents,
    status,
    due_date
  ) VALUES (
    v_default_contract_id,
    NEW.title,
    NEW.payment_cents,
    CASE 
      WHEN NEW.payment_status = 'confirmed' THEN 'funded'::contract_milestone_status
      WHEN NEW.payment_status = 'completed' THEN 'released'::contract_milestone_status
      ELSE 'pending'::contract_milestone_status
    END,
    COALESCE(NEW.due_date, CURRENT_TIMESTAMP + INTERVAL '30 days')
  );
  
  -- Add an event in the milestone events log
  INSERT INTO milestone_events (
    milestone_id,
    actor_id,
    actor_role,
    event_type,
    action,
    details,
    icon_type
  ) VALUES (
    NEW.id,
    NULL,
    'system',
    'creation',
    'Created new contract',
    'A new contract was created for this milestone.',
    'contract'
  );
  
  RETURN NEW;
END;
$$;

-- Create or replace the populate_contract_members function to only add project managers
CREATE OR REPLACE FUNCTION public.populate_contract_members(p_contract_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Get the project ID from the contract
  SELECT project_id INTO v_project_id
  FROM contracts
  WHERE id = p_contract_id;
  
  -- Insert only project managers as contract members
  INSERT INTO contract_members (
    contract_id,
    user_id,
    role,
    joined_at
  )
  SELECT 
    p_contract_id,
    pm.user_id,
    pm.role,
    NOW()
  FROM 
    project_members pm
  WHERE 
    pm.project_id = v_project_id 
    AND pm.role = 'pm' -- Only include project managers
  ON CONFLICT (contract_id, user_id) DO NOTHING; -- Avoid duplicates
END;
$$;

-- Create or replace trigger to execute the function when a new milestone is inserted
DROP TRIGGER IF EXISTS handle_new_milestone_trigger ON public.milestones;
CREATE TRIGGER handle_new_milestone_trigger
AFTER INSERT ON public.milestones
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_milestone();

-- Add another function to keep contract milestone and milestone in sync
CREATE OR REPLACE FUNCTION public.sync_milestone_with_contract_milestone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract_id UUID;
  v_contract_milestone_id UUID;
BEGIN
  -- Find the associated contract
  SELECT c.id INTO v_contract_id
  FROM contracts c
  WHERE c.project_id = NEW.project_id
  ORDER BY c.created_at DESC
  LIMIT 1;
  
  IF v_contract_id IS NOT NULL THEN
    -- Find the contract milestone with matching title
    SELECT cm.id INTO v_contract_milestone_id
    FROM contract_milestones cm
    WHERE cm.contract_id = v_contract_id AND cm.title = OLD.title;
    
    -- If found, update it to match the milestone
    IF v_contract_milestone_id IS NOT NULL THEN
      UPDATE contract_milestones
      SET 
        title = NEW.title,
        amount_cents = NEW.payment_cents,
        due_date = COALESCE(NEW.due_date, due_date),
        status = CASE 
          WHEN NEW.payment_status = 'confirmed' THEN 'funded'::contract_milestone_status
          WHEN NEW.payment_status = 'completed' THEN 'released'::contract_milestone_status
          ELSE 'pending'::contract_milestone_status
        END
      WHERE id = v_contract_milestone_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create or replace trigger to execute the sync function when a milestone is updated
DROP TRIGGER IF EXISTS sync_milestone_with_contract_milestone_trigger ON public.milestones;
CREATE TRIGGER sync_milestone_with_contract_milestone_trigger
AFTER UPDATE ON public.milestones
FOR EACH ROW
EXECUTE FUNCTION public.sync_milestone_with_contract_milestone();

-- Grant execution privileges on the new functions
GRANT EXECUTE ON FUNCTION public.handle_new_milestone() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_milestone_with_contract_milestone() TO authenticated;
GRANT EXECUTE ON FUNCTION public.populate_contract_members(UUID) TO authenticated;

-- Add comment explaining the purpose of this migration
COMMENT ON FUNCTION public.handle_new_milestone() IS 'Creates a new contract for each milestone';
COMMENT ON FUNCTION public.sync_milestone_with_contract_milestone() IS 'Keeps contract milestone and project milestone in sync';
COMMENT ON FUNCTION public.populate_contract_members(UUID) IS 'Populates contract members with project managers only';