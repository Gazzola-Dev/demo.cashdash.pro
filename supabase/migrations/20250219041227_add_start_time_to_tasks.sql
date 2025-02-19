-- Add start_time column to tasks table
ALTER TABLE public.tasks
ADD COLUMN start_time BIGINT;

-- Add comment explaining the column
COMMENT ON COLUMN public.tasks.start_time IS 'Unix timestamp in seconds for when the task was started';

-- Create index for efficient queries on start_time
CREATE INDEX idx_tasks_start_time ON public.tasks(start_time);

-- Add optional trigger to ensure start_time is set when status changes to in_progress
CREATE OR REPLACE FUNCTION public.handle_task_start_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' AND NEW.start_time IS NULL THEN
        NEW.start_time = EXTRACT(EPOCH FROM NOW())::BIGINT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_task_start_time
    BEFORE UPDATE OF status ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_task_start_time();