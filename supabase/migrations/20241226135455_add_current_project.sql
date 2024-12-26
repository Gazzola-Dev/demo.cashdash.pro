-- Add current_project_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN current_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create function to automatically set current_project when joining a project
CREATE OR REPLACE FUNCTION public.handle_project_join()
RETURNS TRIGGER AS $$
BEGIN
    -- Set as current project if user doesn't have one
    UPDATE public.profiles
    SET current_project_id = NEW.project_id
    WHERE id = NEW.user_id
    AND current_project_id IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new project membership
CREATE TRIGGER on_project_join
    AFTER INSERT ON public.project_members
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_project_join();

-- Create RLS policy for updating current project
CREATE POLICY "Users can update their own current project"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);