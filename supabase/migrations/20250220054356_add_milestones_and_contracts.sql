-- Create milestone status enum
CREATE TYPE public.milestone_status AS ENUM (
  'draft',
  'backlog',
  'planned',
  'in_progress',
  'in_review',
  'completed'
);

-- Create contract status enum
CREATE TYPE public.contract_status AS ENUM (
  'active',
  'completed',
  'cancelled'
);

-- Create contract milestone status enum
CREATE TYPE public.contract_milestone_status AS ENUM (
  'pending',
  'funded',
  'released'
);

-- Create milestones table
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  status milestone_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT milestones_dates_check CHECK (start_date <= due_date)
);

-- Create milestone_tasks junction table
CREATE TABLE public.milestone_tasks (
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (milestone_id, task_id)
);

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  upwork_contract_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_amount_cents INTEGER NOT NULL CHECK (total_amount_cents >= 0),
  currency TEXT NOT NULL,
  status contract_status NOT NULL DEFAULT 'active',
  client_name TEXT NOT NULL,
  client_company TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contracts_dates_check CHECK (start_date <= end_date)
);

-- Create contract_milestones table
CREATE TABLE public.contract_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  status contract_milestone_status NOT NULL DEFAULT 'pending',
  due_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create updated_at triggers for all new tables
CREATE TRIGGER milestones_updated_at
    BEFORE UPDATE ON public.milestones
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER contracts_updated_at
    BEFORE UPDATE ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER contract_milestones_updated_at
    BEFORE UPDATE ON public.contract_milestones
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add RLS policies
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_milestones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for milestones
CREATE POLICY "Enable read access for project members on milestones" 
ON public.milestones
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_members.project_id = milestones.project_id 
        AND project_members.user_id = auth.uid()
    )
);

CREATE POLICY "Enable write access for project admins and owners on milestones" 
ON public.milestones
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_members.project_id = milestones.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role IN ('admin', 'owner')
    )
);

-- Create RLS policies for milestone_tasks
CREATE POLICY "Enable read access for project members on milestone_tasks" 
ON public.milestone_tasks
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM milestones m
        INNER JOIN project_members pm ON m.project_id = pm.project_id
        WHERE m.id = milestone_tasks.milestone_id
        AND pm.user_id = auth.uid()
    )
);

CREATE POLICY "Enable write access for project admins and owners on milestone_tasks" 
ON public.milestone_tasks
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM milestones m
        INNER JOIN project_members pm ON m.project_id = pm.project_id
        WHERE m.id = milestone_tasks.milestone_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'owner')
    )
);

-- Create RLS policies for contracts
CREATE POLICY "Enable read access for project members on contracts" 
ON public.contracts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_members.project_id = contracts.project_id 
        AND project_members.user_id = auth.uid()
    )
);

CREATE POLICY "Enable write access for project admins and owners on contracts" 
ON public.contracts
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_members.project_id = contracts.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role IN ('admin', 'owner')
    )
);

-- Create RLS policies for contract_milestones
CREATE POLICY "Enable read access for project members on contract_milestones" 
ON public.contract_milestones
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM contracts c
        INNER JOIN project_members pm ON c.project_id = pm.project_id
        WHERE c.id = contract_milestones.contract_id
        AND pm.user_id = auth.uid()
    )
);

CREATE POLICY "Enable write access for project admins and owners on contract_milestones" 
ON public.contract_milestones
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM contracts c
        INNER JOIN project_members pm ON c.project_id = pm.project_id
        WHERE c.id = contract_milestones.contract_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'owner')
    )
);

-- Grant necessary permissions
GRANT ALL ON TABLE public.milestones TO authenticated;
GRANT ALL ON TABLE public.milestone_tasks TO authenticated;
GRANT ALL ON TABLE public.contracts TO authenticated;
GRANT ALL ON TABLE public.contract_milestones TO authenticated;