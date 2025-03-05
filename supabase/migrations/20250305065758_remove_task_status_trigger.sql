-- Disable the trigger that changes task priority when status changes
DROP TRIGGER IF EXISTS handle_task_status_change ON tasks;

-- Also drop the function that backs the trigger
DROP FUNCTION IF EXISTS handle_task_status_change();

-- If there are other triggers or functions with similar behavior, they would be included here