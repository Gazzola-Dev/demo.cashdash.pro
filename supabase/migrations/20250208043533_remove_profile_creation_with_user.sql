-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Then drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Add a comment explaining the change
COMMENT ON TABLE public.profiles IS 'User profiles are now created when an invitation is sent to ensure email consistency';