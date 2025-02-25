-- Create a subscription status enum
CREATE TYPE public.subscription_status AS ENUM (
  'active',
  'canceled',
  'expired',
  'past_due',
  'trialing'
);

-- Add subscription_status column to projects table if it doesn't already exist
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'trialing';

-- Create project_subscriptions table
CREATE TABLE public.project_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_intent_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  status subscription_status NOT NULL DEFAULT 'active',
  tier TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Add index for project lookup
CREATE INDEX idx_project_subscriptions_project_id ON public.project_subscriptions(project_id);

-- Add index for user lookup
CREATE INDEX idx_project_subscriptions_user_id ON public.project_subscriptions(user_id);

-- Add index for payment intent lookup
CREATE INDEX idx_project_subscriptions_payment_intent_id ON public.project_subscriptions(payment_intent_id);

-- Add update trigger for timestamps
CREATE TRIGGER set_project_subscriptions_updated_at
  BEFORE UPDATE ON public.project_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS policies for project_subscriptions
ALTER TABLE public.project_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" 
  ON public.project_subscriptions
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

-- Allow project members to view subscriptions for their projects
CREATE POLICY "Project members can view project subscriptions" 
  ON public.project_subscriptions
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_members.project_id = project_subscriptions.project_id 
      AND project_members.user_id = auth.uid()
    )
  );

-- Only service role can insert/update subscriptions
CREATE POLICY "Only service role can insert subscriptions" 
  ON public.project_subscriptions
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Only service role can update subscriptions" 
  ON public.project_subscriptions
  FOR UPDATE 
  TO service_role
  USING (true);

-- Grant permissions to authenticated users
GRANT SELECT ON public.project_subscriptions TO authenticated;