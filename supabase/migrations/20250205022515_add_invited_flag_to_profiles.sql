-- Add invited column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN invited BOOLEAN NOT NULL DEFAULT false;

-- Update existing profiles based on project invitations
UPDATE public.profiles p
SET invited = true
WHERE EXISTS (
    SELECT 1 
    FROM public.project_invitations pi 
    WHERE pi.email = (
        SELECT email 
        FROM auth.users 
        WHERE id = p.id
    )
);

-- Create function to handle invitation updates
CREATE OR REPLACE FUNCTION public.handle_invitation_invited()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the invited flag for any matching profile
    UPDATE public.profiles p
    SET invited = true
    WHERE EXISTS (
        SELECT 1 
        FROM auth.users u 
        WHERE u.id = p.id 
        AND u.email = NEW.email
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update invited status
DROP TRIGGER IF EXISTS on_invitation_invited ON public.project_invitations;
CREATE TRIGGER on_invitation_invited
    AFTER INSERT ON public.project_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_invitation_invited();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_invited 
ON public.profiles(invited);

-- Grant necessary permissions
GRANT UPDATE ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_invitation_invited() TO authenticated;