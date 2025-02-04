CREATE OR REPLACE FUNCTION public.upsert_draft_task(p_project_slug TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    found_project projects;
    existing_draft tasks;
    new_task tasks;
    result json;
BEGIN
    -- First find the project
    SELECT * INTO found_project 
    FROM projects 
    WHERE slug = p_project_slug;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    -- Look for most recent draft task
    SELECT * INTO existing_draft 
    FROM tasks 
    WHERE project_id = found_project.id 
    AND status = 'draft'
    ORDER BY updated_at DESC 
    LIMIT 1;

    IF FOUND THEN
        -- Return existing draft task with related data
        SELECT jsonb_build_object(
            'task', t,
            'project', p,
            'subtasks', COALESCE(array_agg(s) FILTER (WHERE s.id IS NOT NULL), ARRAY[]::subtasks[]),
            'comments', COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', c.id,
                    'created_at', c.created_at,
                    'updated_at', c.updated_at,
                    'content', c.content,
                    'is_edited', c.is_edited,
                    'user', prof_c
                )
            ) FILTER (WHERE c.id IS NOT NULL), '[]'::jsonb),
            'task_schedule', COALESCE(array_agg(ts) FILTER (WHERE ts.id IS NOT NULL), ARRAY[]::task_schedule[]),
            'assignee_profile', prof_a
        )::json INTO result
        FROM tasks t
        INNER JOIN projects p ON t.project_id = p.id
        LEFT JOIN subtasks s ON t.id = s.task_id
        LEFT JOIN comments c ON t.id = (c.content_id::uuid) AND c.content_type = 'task'
        LEFT JOIN profiles prof_c ON c.user_id = prof_c.id
        LEFT JOIN task_schedule ts ON t.id = ts.task_id
        LEFT JOIN profiles prof_a ON t.assignee = prof_a.id
        WHERE t.id = existing_draft.id
        GROUP BY t.id, p.id, prof_a.id;

        RETURN result;
    ELSE
        -- Create new draft task
        INSERT INTO tasks (
            title,
            description,
            status,
            priority,
            project_id,
            prefix,
            slug,
            ordinal_id
        )
        VALUES (
            'New Task',
            NULL,
            'draft',
            'medium',
            found_project.id,
            found_project.prefix,
            found_project.prefix || '-' || (SELECT COALESCE(MAX(ordinal_id), 0) + 1 FROM tasks WHERE project_id = found_project.id),
            (SELECT COALESCE(MAX(ordinal_id), 0) + 1 FROM tasks WHERE project_id = found_project.id)
        )
        RETURNING * INTO new_task;

        -- Return new task with related data
        SELECT jsonb_build_object(
            'task', t,
            'project', p,
            'subtasks', ARRAY[]::subtasks[],
            'comments', '[]'::jsonb,
            'task_schedule', ARRAY[]::task_schedule[],
            'assignee_profile', NULL
        )::json INTO result
        FROM tasks t
        INNER JOIN projects p ON t.project_id = p.id
        WHERE t.id = new_task.id;

        RETURN result;
    END IF;
END;
$$;