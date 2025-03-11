-- Create event_type enum
CREATE TYPE public.event_type AS ENUM (
  'creation',
  'update',
  'status_change',
  'price_change',
  'date_change',
  'approval',
  'system_notification',
  'dispute',
  'completion'
);

-- Create actor_role enum
CREATE TYPE public.actor_role AS ENUM (
  'pm',
  'client',
  'system',
  'developer'
);

-- Create milestone_events table
CREATE TABLE public.milestone_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role public.actor_role NOT NULL,
  event_type public.event_type NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  icon_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Index for fast querying of milestone events
  CONSTRAINT milestone_events_valid_system_actor CHECK (
    (actor_role = 'system' AND actor_id IS NULL) OR 
    (actor_role != 'system' AND actor_id IS NOT NULL)
  )
);

-- Add indexes for common queries
CREATE INDEX idx_milestone_events_milestone_id ON public.milestone_events(milestone_id);
CREATE INDEX idx_milestone_events_actor_id ON public.milestone_events(actor_id);
CREATE INDEX idx_milestone_events_created_at ON public.milestone_events(created_at DESC);

-- Enable RLS for milestone_events table
ALTER TABLE public.milestone_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow project members to read milestone events
CREATE POLICY "Enable read access for project members on milestone_events" 
ON public.milestone_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM milestones m
    INNER JOIN project_members pm ON m.project_id = pm.project_id
    WHERE m.id = milestone_events.milestone_id
    AND pm.user_id = auth.uid()
  )
);

-- Create function to automatically record milestone events on updates
CREATE OR REPLACE FUNCTION public.record_milestone_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_actor_role public.actor_role;
  v_event_type public.event_type;
  v_action TEXT;
  v_details TEXT;
  v_icon_type TEXT;
BEGIN
  -- Get the current user ID
  v_actor_id := auth.uid();
  
  -- Determine actor role based on project membership
  SELECT 
    CASE 
      WHEN pm.role = 'owner' OR pm.role = 'admin' THEN 'pm'::public.actor_role
      WHEN pm.role = 'client' THEN 'client'::public.actor_role
      ELSE 'developer'::public.actor_role
    END INTO v_actor_role
  FROM project_members pm
  JOIN milestones m ON pm.project_id = m.project_id
  WHERE pm.user_id = v_actor_id
  AND m.id = NEW.id;
  
  -- If no role found, default to system
  IF v_actor_role IS NULL THEN
    v_actor_role := 'system';
    v_actor_id := NULL;
  END IF;
  
  -- For insert operations
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'creation';
    v_action := 'Created a new draft Milestone';
    v_icon_type := 'edit';
    
    INSERT INTO public.milestone_events (
      milestone_id, actor_id, actor_role, event_type, action, details, icon_type
    ) VALUES (
      NEW.id, v_actor_id, v_actor_role, v_event_type, v_action, NULL, v_icon_type
    );
    
    RETURN NEW;
  END IF;
  
  -- For update operations
  IF TG_OP = 'UPDATE' THEN
    -- Status change
    IF OLD.status != NEW.status THEN
      v_event_type := 'status_change';
      v_action := 'Changed the Milestone status';
      v_details := 'From ''' || OLD.status || ''' to ''' || NEW.status || '''';
      
      IF NEW.status = 'active' THEN
        v_icon_type := 'activity';
      ELSIF NEW.status = 'completed' THEN
        v_icon_type := 'check';
      ELSIF NEW.status = 'archived' THEN
        v_icon_type := 'archive';
      ELSE
        v_icon_type := 'activity';
      END IF;
      
      INSERT INTO public.milestone_events (
        milestone_id, actor_id, actor_role, event_type, action, details, icon_type
      ) VALUES (
        NEW.id, v_actor_id, v_actor_role, v_event_type, v_action, v_details, v_icon_type
      );
    END IF;
    
    -- Title change
    IF OLD.title != NEW.title THEN
      v_event_type := 'update';
      v_action := 'Changed the Milestone name';
      v_details := 'From ''' || OLD.title || ''' to ''' || NEW.title || '''';
      v_icon_type := 'edit';
      
      INSERT INTO public.milestone_events (
        milestone_id, actor_id, actor_role, event_type, action, details, icon_type
      ) VALUES (
        NEW.id, v_actor_id, v_actor_role, v_event_type, v_action, v_details, v_icon_type
      );
    END IF;
    
    -- Description change
    IF COALESCE(OLD.description, '') != COALESCE(NEW.description, '') THEN
      v_event_type := 'update';
      v_action := 'Updated the Milestone description';
      v_icon_type := 'edit';
      
      INSERT INTO public.milestone_events (
        milestone_id, actor_id, actor_role, event_type, action, details, icon_type
      ) VALUES (
        NEW.id, v_actor_id, v_actor_role, v_event_type, v_action, NULL, v_icon_type
      );
    END IF;
    
    -- Due date change
    IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
      v_event_type := 'date_change';
      v_action := 'Changed the Milestone due date';
      
      IF OLD.due_date IS NULL THEN
        v_details := 'Set due date to ' || to_char(NEW.due_date, 'Month DD, YYYY');
      ELSIF NEW.due_date IS NULL THEN
        v_details := 'Removed due date';
      ELSE
        v_details := 'From ' || to_char(OLD.due_date, 'Month DD, YYYY') || 
                     ' to ' || to_char(NEW.due_date, 'Month DD, YYYY');
      END IF;
      
      v_icon_type := 'calendar';
      
      INSERT INTO public.milestone_events (
        milestone_id, actor_id, actor_role, event_type, action, details, icon_type
      ) VALUES (
        NEW.id, v_actor_id, v_actor_role, v_event_type, v_action, v_details, v_icon_type
      );
    END IF;
    
    -- Payment change
    IF OLD.payment_cents != NEW.payment_cents THEN
      v_event_type := 'price_change';
      v_action := 'Set Milestone price';
      v_details := '$' || (NEW.payment_cents::decimal / 100)::text;
      v_icon_type := 'dollar';
      
      INSERT INTO public.milestone_events (
        milestone_id, actor_id, actor_role, event_type, action, details, icon_type
      ) VALUES (
        NEW.id, v_actor_id, v_actor_role, v_event_type, v_action, v_details, v_icon_type
      );
    END IF;
    
    -- Payment status change
    IF OLD.payment_status != NEW.payment_status THEN
      v_event_type := 'update';
      v_action := 'Updated payment status';
      v_details := 'From ''' || OLD.payment_status || ''' to ''' || NEW.payment_status || '''';
      
      IF NEW.payment_status = 'disputed' THEN
        v_icon_type := 'alert';
      ELSE
        v_icon_type := 'dollar';
      END IF;
      
      INSERT INTO public.milestone_events (
        milestone_id, actor_id, actor_role, event_type, action, details, icon_type
      ) VALUES (
        NEW.id, v_actor_id, v_actor_role, v_event_type, v_action, v_details, v_icon_type
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger for milestone events
CREATE TRIGGER milestone_events_trigger
AFTER INSERT OR UPDATE ON public.milestones
FOR EACH ROW
EXECUTE FUNCTION public.record_milestone_event();

-- Create function to record approval events
CREATE OR REPLACE FUNCTION public.record_milestone_approval_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_milestone milestones;
  v_actor_role public.actor_role;
  v_action TEXT;
  v_details TEXT;
  v_approval_count INTEGER;
  v_total_approvals INTEGER;
BEGIN
  -- Get milestone data
  SELECT * INTO v_milestone FROM milestones WHERE id = NEW.milestone_id;
  
  -- Determine actor role based on project membership
  SELECT 
    CASE 
      WHEN pm.role = 'owner' OR pm.role = 'admin' THEN 'pm'::public.actor_role
      WHEN pm.role = 'client' THEN 'client'::public.actor_role
      ELSE 'developer'::public.actor_role
    END INTO v_actor_role
  FROM project_members pm
  WHERE pm.user_id = NEW.user_id
  AND pm.project_id = v_milestone.project_id;
  
  -- If no role found, default to system (should not happen)
  IF v_actor_role IS NULL THEN
    v_actor_role := 'developer';
  END IF;
  
  -- Count current approvals
  SELECT COUNT(*) INTO v_approval_count
  FROM milestone_approvals
  WHERE milestone_id = NEW.milestone_id
  AND approved = TRUE;
  
  -- Get needed approvals (normally 2 - client and PM)
  v_total_approvals := 2;
  
  IF NEW.approved = TRUE THEN
    v_action := 'Marked as approved';
    v_details := v_approval_count || '/' || v_total_approvals || ' approvals';
    
    INSERT INTO public.milestone_events (
      milestone_id, actor_id, actor_role, event_type, action, details, icon_type
    ) VALUES (
      NEW.milestone_id, NEW.user_id, v_actor_role, 'approval', v_action, v_details, 'check'
    );
    
    -- If this is the final approval, add a system event
    IF v_approval_count >= v_total_approvals THEN
      INSERT INTO public.milestone_events (
        milestone_id, actor_id, actor_role, event_type, action, details, icon_type
      ) VALUES (
        NEW.milestone_id, NULL, 'system', 'system_notification', 
        'Milestone is approved, awaiting payment', NULL, 'dollar'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for milestone approval events
CREATE TRIGGER milestone_approval_events_trigger
AFTER INSERT OR UPDATE ON public.milestone_approvals
FOR EACH ROW
EXECUTE FUNCTION public.record_milestone_approval_event();

-- Create function to record task completion in milestone
CREATE OR REPLACE FUNCTION public.record_task_completion_for_milestone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_milestone_id UUID;
  v_task_count INTEGER;
  v_completed_count INTEGER;
BEGIN
  -- Only process when task status changes to completed
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Find milestone(s) that include this task
    FOR v_milestone_id IN 
      SELECT milestone_id FROM milestone_tasks WHERE task_id = NEW.id
    LOOP
      -- Count total and completed tasks
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed
      INTO v_task_count, v_completed_count
      FROM milestone_tasks mt
      JOIN tasks t ON mt.task_id = t.id
      WHERE mt.milestone_id = v_milestone_id;
      
      -- Record the task completion event
      INSERT INTO public.milestone_events (
        milestone_id, actor_id, actor_role, event_type, action, details, icon_type
      ) VALUES (
        v_milestone_id, auth.uid(), 'developer', 'completion', 
        'Task ' || NEW.ordinal_id || ' was marked as completed!',
        v_completed_count || '/' || v_task_count || ' tasks complete',
        'check'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for task completion events
CREATE TRIGGER task_completion_milestone_trigger
AFTER UPDATE OF status ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.record_task_completion_for_milestone();

-- Add permission for authenticated users to select from milestone_events
GRANT SELECT ON public.milestone_events TO authenticated;

-- Add the enum types to the authenticated role
GRANT USAGE ON TYPE public.event_type TO authenticated;
GRANT USAGE ON TYPE public.actor_role TO authenticated;

-- Create function to get milestone events
CREATE OR REPLACE FUNCTION public.get_milestone_events(milestone_id UUID)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', me.id,
      'milestone_id', me.milestone_id,
      'event_type', me.event_type,
      'action', me.action,
      'details', me.details,
      'icon_type', me.icon_type,
      'created_at', me.created_at,
      'actor', jsonb_build_object(
        'id', prof.id,
        'name', prof.display_name,
        'role', me.actor_role,
        'avatar', prof.avatar_url
      )
    )::json
  FROM milestone_events me
  LEFT JOIN profiles prof ON me.actor_id = prof.id
  WHERE me.milestone_id = get_milestone_events.milestone_id
  ORDER BY me.created_at DESC;
END;
$$;

-- Grant usage of the function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_milestone_events(UUID) TO authenticated;

-- Create a view for easier querying of milestone events with actor information
CREATE VIEW public.milestone_events_view AS
SELECT 
  me.id,
  me.milestone_id,
  me.actor_id,
  me.actor_role,
  me.event_type,
  me.action,
  me.details,
  me.icon_type,
  me.created_at,
  p.display_name AS actor_name,
  p.avatar_url AS actor_avatar,
  m.project_id
FROM milestone_events me
LEFT JOIN profiles p ON me.actor_id = p.id
JOIN milestones m ON me.milestone_id = m.id;

-- Grant select on the view to authenticated users
GRANT SELECT ON public.milestone_events_view TO authenticated;

-- Create action to load milestone events
CREATE OR REPLACE FUNCTION public.list_milestone_events(p_milestone_id UUID)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT get_milestone_events(p_milestone_id);
END;
$$;

-- Grant execute on the action to authenticated users
GRANT EXECUTE ON FUNCTION public.list_milestone_events(UUID) TO authenticated;