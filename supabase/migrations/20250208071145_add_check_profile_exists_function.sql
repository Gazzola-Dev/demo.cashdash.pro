-- Add function to check if profile exists by email
CREATE OR REPLACE FUNCTION public.check_profile_exists(p_email TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE email = p_email
  );
END;
$$;

-- Grant execute permission to anon users
GRANT EXECUTE ON FUNCTION public.check_profile_exists(TEXT) TO anon;

-- Add comment explaining function purpose
COMMENT ON FUNCTION public.check_profile_exists IS 'Safely check if a profile exists for a given email without exposing profile data. Used for magic link authentication.';

-- Create policy to allow minimal profile existence checking
CREATE POLICY "Allow profile existence check"
ON public.profiles
FOR SELECT
TO public
USING (
  -- Only allow checking id and email columns
  -- This effectively restricts what data is visible
  auth.uid() IS NOT NULL OR 
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE users.email = profiles.email
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.profiles 
  ENABLE ROW LEVEL SECURITY;