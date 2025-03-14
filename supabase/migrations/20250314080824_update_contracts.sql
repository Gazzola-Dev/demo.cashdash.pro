-- Migration to enhance contract functionality
-- 1. Create a contract_members table for proper user associations
CREATE TABLE public.contract_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('project_manager', 'developer', 'client', 'admin')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contract_id, user_id)
);

-- 2. Create contract_approvals table to track approvals
CREATE TABLE public.contract_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approval_type VARCHAR(50) NOT NULL CHECK (approval_type IN ('contract_terms', 'payment', 'completion')),
  approved BOOLEAN NOT NULL DEFAULT false,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contract_id, user_id, approval_type)
);

-- 3. Create contract_payments table for tracking payments
CREATE TABLE public.contract_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.contract_milestones(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  payment_id VARCHAR(100),
  payer_id UUID REFERENCES auth.users(id),
  payee_id UUID REFERENCES auth.users(id),
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Add a function to log contract events to milestone_events
CREATE OR REPLACE FUNCTION public.log_contract_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_milestone_id UUID;
  v_actor_id UUID = auth.uid();
  v_actor_role public.actor_role;
  v_event_type public.event_type;
  v_action TEXT;
  v_details TEXT;
  v_icon_type TEXT;
BEGIN
  -- Get project ID and find the associated milestone
  SELECT project_id INTO v_project_id FROM contracts WHERE id = NEW.id;
  
  -- Find the current milestone for this project
  SELECT id INTO v_milestone_id FROM milestones 
  WHERE project_id = v_project_id 
  AND id = (SELECT current_milestone_id FROM projects WHERE id = v_project_id);
  
  -- If no milestone found, exit
  IF v_milestone_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Determine the actor role
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM project_members WHERE project_id = v_project_id AND user_id = v_actor_id AND role = 'admin') THEN 'pm'::public.actor_role
      WHEN EXISTS (SELECT 1 FROM project_members WHERE project_id = v_project_id AND user_id = v_actor_id AND role = 'owner') THEN 'pm'::public.actor_role
      WHEN NEW.client_name ILIKE '%' || (SELECT display_name FROM profiles WHERE id = v_actor_id) || '%' THEN 'client'::public.actor_role
      ELSE 'developer'::public.actor_role
    END INTO v_actor_role;
  
  -- Set default event type
  v_event_type := 'update'::public.event_type;
  
  -- Handle different operations
  IF TG_OP = 'INSERT' THEN
    v_action := 'Created a new contract: ' || NEW.title;
    v_details := 'Contract amount: ' || (NEW.total_amount_cents/100)::text || ' ' || NEW.currency;
    v_icon_type := 'contract-new';
    v_event_type := 'creation'::public.event_type;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Detect what was changed
    IF NEW.status != OLD.status THEN
      v_action := 'Updated contract status to: ' || NEW.status;
      v_details := 'Contract: ' || NEW.title;
      v_icon_type := 'status-change';
      v_event_type := 'status_change'::public.event_type;
    ELSIF NEW.total_amount_cents != OLD.total_amount_cents THEN
      v_action := 'Updated contract amount';
      v_details := 'New amount: ' || (NEW.total_amount_cents/100)::text || ' ' || NEW.currency;
      v_icon_type := 'price-change';
      v_event_type := 'price_change'::public.event_type;
    ELSE
      v_action := 'Updated contract: ' || NEW.title;
      v_details := NULL;
      v_icon_type := 'pencil';
    END IF;
  END IF;
  
  -- Insert the event into milestone_events
  INSERT INTO public.milestone_events (
    milestone_id, 
    actor_id, 
    actor_role, 
    event_type, 
    action, 
    details, 
    icon_type
  ) VALUES (
    v_milestone_id,
    v_actor_id,
    v_actor_role,
    v_event_type,
    v_action,
    v_details,
    v_icon_type
  );
  
  RETURN NEW;
END;
$$;

-- 5. Create trigger for contracts table to log events
CREATE TRIGGER contracts_log_event
AFTER INSERT OR UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.log_contract_event();

-- 6. Create function to log contract approval events
CREATE OR REPLACE FUNCTION public.log_contract_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract_id UUID;
  v_project_id UUID;
  v_milestone_id UUID;
  v_actor_id UUID = auth.uid();
  v_actor_role public.actor_role;
  v_action TEXT;
  v_details TEXT;
BEGIN
  -- Get contract ID and find the associated project and milestone
  v_contract_id := NEW.contract_id;
  
  SELECT project_id INTO v_project_id FROM contracts WHERE id = v_contract_id;
  
  -- Find the current milestone for this project
  SELECT id INTO v_milestone_id FROM milestones 
  WHERE project_id = v_project_id 
  AND id = (SELECT current_milestone_id FROM projects WHERE id = v_project_id);
  
  -- If no milestone found, exit
  IF v_milestone_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Determine the actor role
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM project_members WHERE project_id = v_project_id AND user_id = v_actor_id AND role = 'admin') THEN 'pm'::public.actor_role
      WHEN EXISTS (SELECT 1 FROM project_members WHERE project_id = v_project_id AND user_id = v_actor_id AND role = 'owner') THEN 'pm'::public.actor_role
      WHEN EXISTS (SELECT 1 FROM contracts c WHERE c.id = v_contract_id AND c.client_name ILIKE '%' || (SELECT display_name FROM profiles WHERE id = v_actor_id) || '%') THEN 'client'::public.actor_role
      ELSE 'developer'::public.actor_role
    END INTO v_actor_role;
  
  -- Set action based on approval status
  IF NEW.approved THEN
    v_action := 'Approved the contract';
    v_details := 'Approval type: ' || NEW.approval_type;
  ELSE
    v_action := 'Revoked contract approval';
    v_details := 'Approval type: ' || NEW.approval_type;
  END IF;
  
  -- Insert the event into milestone_events
  INSERT INTO public.milestone_events (
    milestone_id, 
    actor_id, 
    actor_role, 
    event_type, 
    action, 
    details, 
    icon_type
  ) VALUES (
    v_milestone_id,
    v_actor_id,
    v_actor_role,
    'approval'::public.event_type,
    v_action,
    v_details,
    'check'
  );
  
  RETURN NEW;
END;
$$;

-- 7. Create trigger for contract_approvals to log events
CREATE TRIGGER contract_approvals_log_event
AFTER INSERT OR UPDATE ON public.contract_approvals
FOR EACH ROW
EXECUTE FUNCTION public.log_contract_approval();

-- 8. Add RLS policies for the new tables
ALTER TABLE public.contract_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_payments ENABLE ROW LEVEL SECURITY;

-- RLS for contract_members
CREATE POLICY "Enable read access for project members on contract_members" 
ON public.contract_members
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM contracts c
        INNER JOIN project_members pm ON c.project_id = pm.project_id
        WHERE c.id = contract_members.contract_id
        AND pm.user_id = auth.uid()
    )
);

-- RLS for contract_approvals
CREATE POLICY "Enable read access for project members on contract_approvals" 
ON public.contract_approvals
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM contracts c
        INNER JOIN project_members pm ON c.project_id = pm.project_id
        WHERE c.id = contract_approvals.contract_id
        AND pm.user_id = auth.uid()
    )
);

-- RLS for contract_payments
CREATE POLICY "Enable read access for project members on contract_payments" 
ON public.contract_payments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM contracts c
        INNER JOIN project_members pm ON c.project_id = pm.project_id
        WHERE c.id = contract_payments.contract_id
        AND pm.user_id = auth.uid()
    )
);

-- Grant permissions
GRANT ALL ON public.contract_members TO authenticated;
GRANT ALL ON public.contract_approvals TO authenticated;
GRANT ALL ON public.contract_payments TO authenticated;

-- 9. Create helper function to populate contract members from project members
CREATE OR REPLACE FUNCTION public.populate_contract_members(p_contract_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- Get the project ID for the contract
  SELECT project_id INTO v_project_id FROM contracts WHERE id = p_contract_id;
  
  -- Insert project members as contract members with appropriate roles
  INSERT INTO contract_members (contract_id, user_id, role)
  SELECT 
    p_contract_id, 
    pm.user_id, 
    CASE 
      WHEN pm.role = 'owner' THEN 'admin'
      WHEN pm.role = 'admin' THEN 'project_manager'
      ELSE 'developer' 
    END
  FROM project_members pm
  WHERE pm.project_id = v_project_id
  ON CONFLICT (contract_id, user_id) DO NOTHING;
END;
$$;

-- 10. Create trigger to automatically populate contract members when a contract is created
CREATE OR REPLACE FUNCTION public.auto_populate_contract_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Call the function to populate contract members
  PERFORM populate_contract_members(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER contracts_auto_populate_members
AFTER INSERT ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.auto_populate_contract_members();