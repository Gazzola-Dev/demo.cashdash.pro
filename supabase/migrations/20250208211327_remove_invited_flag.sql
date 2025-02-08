-- Drop the triggers first
DROP TRIGGER IF EXISTS on_invitation_invited ON public.project_invitations;
DROP TRIGGER IF EXISTS project_invitation_invited_status_trigger ON project_invitations;
DROP TRIGGER IF EXISTS project_member_invited_status_trigger ON project_members;

-- Drop the trigger function
DROP FUNCTION IF EXISTS public.handle_invitation_invited();

-- Drop the index
DROP INDEX IF EXISTS idx_profiles_invited;

-- Remove the invited column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS invited;

-- Revoke the previously granted permissions
REVOKE UPDATE ON public.profiles FROM authenticated;

-- Add comment to document the reversal
COMMENT ON TABLE public.profiles IS 'User profiles table - invited flag removed';