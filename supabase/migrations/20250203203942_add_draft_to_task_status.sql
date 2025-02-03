-- Step 1: Create a backup of the old enum type
CREATE TYPE public.task_status_new AS ENUM ('draft', 'backlog', 'todo', 'in_progress', 'in_review', 'completed');

-- Step 2: Update all tables to use the new type
ALTER TABLE public.tasks 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE task_status_new USING status::text::task_status_new;

ALTER TABLE public.subtasks 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE task_status_new USING status::text::task_status_new;

-- Step 3: Drop the old type
DROP TYPE public.task_status;

-- Step 4: Rename the new type to the old name
ALTER TYPE task_status_new RENAME TO task_status;

-- Step 5: Set the default to 'draft' for new tasks
ALTER TABLE public.tasks
  ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE public.subtasks
  ALTER COLUMN status SET DEFAULT 'draft';

-- Step 6: Add a comment to explain the task status enum
COMMENT ON TYPE public.task_status IS 'Task statuses: draft (initial), backlog, todo, in_progress, in_review, completed';