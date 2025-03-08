-- First, create a new enum type with the desired values including 'active'
CREATE TYPE public.milestone_status_new AS ENUM (
  'draft',
  'active',
  'completed',
  'archived'
);

-- Create a temporary column with the new type
ALTER TABLE public.milestones
  ADD COLUMN status_new milestone_status_new;

-- Update the temporary column with converted values
-- Adding mapping for 'in_progress' and 'in_review' to 'active'
UPDATE public.milestones
SET status_new = CASE
    WHEN status::text = 'draft' THEN 'draft'::milestone_status_new
    WHEN status::text = 'completed' THEN 'completed'::milestone_status_new
    WHEN status::text = 'in_progress' THEN 'active'::milestone_status_new
    WHEN status::text = 'in_review' THEN 'active'::milestone_status_new
    ELSE 'draft'::milestone_status_new
END;

-- Drop the old column and rename the new one
ALTER TABLE public.milestones DROP COLUMN status;
ALTER TABLE public.milestones RENAME COLUMN status_new TO status;

-- Make the new column not null if the original was not null
ALTER TABLE public.milestones ALTER COLUMN status SET NOT NULL;

-- Set the default value if needed
ALTER TABLE public.milestones ALTER COLUMN status SET DEFAULT 'draft'::milestone_status_new;

-- Create a temporary backup of the old type before dropping
-- This is useful for reference but not actually used in the migration
DO $$
BEGIN
  CREATE TYPE public.milestone_status_old AS ENUM (
    'draft',
    'backlog',
    'planned',
    'in_progress',
    'in_review',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop the original milestone_status type if not referenced elsewhere
DROP TYPE public.milestone_status;

-- Rename the new type to the original name
ALTER TYPE public.milestone_status_new RENAME TO milestone_status;