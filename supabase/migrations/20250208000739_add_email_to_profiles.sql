CREATE EXTENSION IF NOT EXISTS "citext";

-- Add email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN email CITEXT;

-- Populate email column from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- Create unique index for email
CREATE UNIQUE INDEX idx_profiles_email ON public.profiles (email) 
WHERE email IS NOT NULL;

-- Set not null constraint
ALTER TABLE public.profiles 
ALTER COLUMN email SET NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.email IS 'User email from auth.users, used for invitations and notifications';

-- Create trigger to automatically update email when auth.users email changes
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_email();