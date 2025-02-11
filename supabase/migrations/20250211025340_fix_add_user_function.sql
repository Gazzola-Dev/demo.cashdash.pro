
-- Disable the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();
-- Create the improved function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile with both id and email
    INSERT INTO public.profiles (
        id,
        email,
        created_at,
        updated_at,
        display_name,
        avatar_url,
        professional_title
    )
    VALUES (
        NEW.id,
        NEW.email,
        NOW(),
        NOW(),
        SPLIT_PART(NEW.email, '@', 1),  -- Use email username as initial display name
        NULL,
        NULL
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        updated_at = NOW()
    WHERE profiles.email IS NULL OR profiles.email <> EXCLUDED.email;
    -- Handle any existing invitations for this email
    UPDATE public.project_invitations
    SET status = 'pending'
    WHERE email = NEW.email
    AND status = 'expired';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
-- Add comment explaining the function
COMMENT ON FUNCTION public.handle_new_user IS 'Creates or updates a profile when a new user is created in auth.users. Also handles pending invitations.';
-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
-- Ensure existing profiles have emails synced
DO $$
BEGIN
    -- Update any profiles that might be missing emails
    UPDATE public.profiles p
    SET 
        email = u.email,
        updated_at = NOW()
    FROM auth.users u
    WHERE p.id = u.id
    AND (p.email IS NULL OR p.email <> u.email);
END $$;
-- Verify email trigger
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET 
        email = NEW.email,
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_email();
-- Add comment explaining the sync function
COMMENT ON FUNCTION public.sync_profile_email IS 'Syncs user email changes from auth.users to profiles';
-- Grant necessary permissions for email sync
GRANT EXECUTE ON FUNCTION public.sync_profile_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_profile_email() TO service_role;