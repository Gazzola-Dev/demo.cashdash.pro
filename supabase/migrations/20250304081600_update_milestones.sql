-- Create payment_status enum
CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'confirmed',
    'active',
    'completed',
    'cancelled',
    'disputed'
);

-- Add payment_cents column to milestones table
ALTER TABLE public.milestones
ADD COLUMN payment_cents INTEGER DEFAULT 0 NOT NULL;

-- Create approval_type enum
CREATE TYPE public.approval_type AS ENUM (
    'payment',
    'completion',
    'cancellation'
);

-- Create dispute_status enum
CREATE TYPE public.dispute_status AS ENUM (
    'open',
    'resolved'
);

-- Create milestone_approvals table
CREATE TABLE public.milestone_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    approval_type public.approval_type NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT false,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(milestone_id, user_id, approval_type)
);

-- Create milestone_disputes table
CREATE TABLE public.milestone_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
    opener_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status public.dispute_status NOT NULL DEFAULT 'open',
    resolution TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Add payment_status column to milestones
ALTER TABLE public.milestones
ADD COLUMN payment_status public.payment_status DEFAULT 'pending' NOT NULL;

-- Create function to update milestone status based on approvals
CREATE OR REPLACE FUNCTION public.update_milestone_status_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_milestone_id UUID;
    v_approval_type public.approval_type;
    v_project_id UUID;
    v_all_approved BOOLEAN := true;
    v_admin_count INTEGER;
    v_approval_count INTEGER;
BEGIN
    v_milestone_id := NEW.milestone_id;
    v_approval_type := NEW.approval_type;
    
    -- Get the project_id for this milestone
    SELECT project_id INTO v_project_id
    FROM milestones
    WHERE id = v_milestone_id;
    
    -- Count how many admins/owners (project managers) exist for this project
    SELECT COUNT(*) INTO v_admin_count
    FROM project_members
    WHERE project_id = v_project_id AND role IN ('admin', 'owner');
    
    -- Count how many approvals exist for this milestone and approval type
    SELECT COUNT(*) INTO v_approval_count
    FROM milestone_approvals
    WHERE milestone_id = v_milestone_id 
      AND approval_type = v_approval_type 
      AND approved = true;
    
    -- Only proceed if all project managers have approved
    IF v_approval_count >= v_admin_count THEN
        -- Update milestone based on approval type
        IF v_approval_type = 'payment' THEN
            UPDATE milestones
            SET payment_status = 'confirmed'
            WHERE id = v_milestone_id;
        ELSIF v_approval_type = 'completion' THEN
            UPDATE milestones
            SET status = 'completed',
                payment_status = 'completed'
            WHERE id = v_milestone_id;
        ELSIF v_approval_type = 'cancellation' THEN
            UPDATE milestones
            SET status = 'backlog',
                payment_status = 'cancelled'
            WHERE id = v_milestone_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on milestone_approvals
CREATE TRIGGER update_milestone_status_on_approval_trigger
    AFTER INSERT OR UPDATE ON milestone_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_milestone_status_on_approval();

-- Create function to update updated_at on milestone_disputes
CREATE OR REPLACE FUNCTION public.handle_dispute_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    
    -- If status was changed to 'resolved', set resolved_at timestamp
    IF OLD.status = 'open' AND NEW.status = 'resolved' THEN
        NEW.resolved_at = now();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on milestone_disputes to update timestamps
CREATE TRIGGER handle_dispute_updated_at_trigger
    BEFORE UPDATE ON milestone_disputes
    FOR EACH ROW
    EXECUTE FUNCTION handle_dispute_updated_at();

-- Create function to handle new disputes
CREATE OR REPLACE FUNCTION public.handle_new_dispute()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update the milestone's payment_status to 'disputed'
    UPDATE milestones
    SET payment_status = 'disputed'
    WHERE id = NEW.milestone_id;
    
    RETURN NEW;
END;
$$;

-- Create trigger on milestone_disputes to handle new disputes
CREATE TRIGGER handle_new_dispute_trigger
    AFTER INSERT ON milestone_disputes
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_dispute();

-- Create function to handle dispute resolution
CREATE OR REPLACE FUNCTION public.handle_dispute_resolution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If dispute status was changed to 'resolved'
    IF OLD.status = 'open' AND NEW.status = 'resolved' THEN
        -- Update the milestone's payment_status to 'pending' or other appropriate status
        -- This is a simplification - in practice, you might want to set a different status 
        -- based on the resolution details
        UPDATE milestones
        SET payment_status = 'pending'
        WHERE id = NEW.milestone_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on milestone_disputes to handle dispute resolution
CREATE TRIGGER handle_dispute_resolution_trigger
    AFTER UPDATE ON milestone_disputes
    FOR EACH ROW
    EXECUTE FUNCTION handle_dispute_resolution();

-- Enable RLS on new tables
ALTER TABLE public.milestone_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_disputes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for milestone_approvals
CREATE POLICY "Enable read access for project members on milestone_approvals" 
ON public.milestone_approvals
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM milestones m
        INNER JOIN project_members pm ON m.project_id = pm.project_id
        WHERE m.id = milestone_approvals.milestone_id
        AND pm.user_id = auth.uid()
    )
);

CREATE POLICY "Enable write access for project admins and owners on milestone_approvals" 
ON public.milestone_approvals
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM milestones m
        INNER JOIN project_members pm ON m.project_id = pm.project_id
        WHERE m.id = milestone_approvals.milestone_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'owner')
    )
);

-- Create RLS policies for milestone_disputes
CREATE POLICY "Enable read access for project members on milestone_disputes" 
ON public.milestone_disputes
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM milestones m
        INNER JOIN project_members pm ON m.project_id = pm.project_id
        WHERE m.id = milestone_disputes.milestone_id
        AND pm.user_id = auth.uid()
    )
);

CREATE POLICY "Enable write access for project members on milestone_disputes" 
ON public.milestone_disputes
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM milestones m
        INNER JOIN project_members pm ON m.project_id = pm.project_id
        WHERE m.id = milestone_disputes.milestone_id
        AND pm.user_id = auth.uid()
    )
);

CREATE POLICY "Enable update access for project admins and owners on milestone_disputes" 
ON public.milestone_disputes
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM milestones m
        INNER JOIN project_members pm ON m.project_id = pm.project_id
        WHERE m.id = milestone_disputes.milestone_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'owner')
    )
);

-- Grant appropriate permissions
GRANT ALL ON TABLE public.milestone_approvals TO authenticated;
GRANT ALL ON TABLE public.milestone_disputes TO authenticated;
GRANT USAGE ON TYPE public.payment_status TO authenticated;
GRANT USAGE ON TYPE public.approval_type TO authenticated;
GRANT USAGE ON TYPE public.dispute_status TO authenticated;