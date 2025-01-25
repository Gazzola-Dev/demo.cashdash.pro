DROP FUNCTION IF EXISTS public.create_comment_data(text, uuid, public.content_type, uuid);
DROP FUNCTION IF EXISTS public.get_task_data(text);

-- Update the create_comment_data function to use proper timestamp handling and return CommentWithProfile format
CREATE OR REPLACE FUNCTION public.create_comment_data(
  comment_content TEXT,
  content_id UUID,
  content_type public.content_type,
  user_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  new_comment_record comments;
BEGIN
  -- Insert the comment with proper UUID handling
  INSERT INTO comments (
    content,
    content_id,
    content_type,
    user_id,
    created_at,
    updated_at
  )
  VALUES (
    comment_content,
    content_id,  -- Keep as UUID
    content_type,
    user_id,
    now(),
    now()
  )
  RETURNING * INTO new_comment_record;

  -- Build the CommentWithProfile format response
  WITH comment_with_profile AS (
    SELECT 
      c.*,
      to_jsonb(p.*) AS user_data
    FROM comments c
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.id = new_comment_record.id
  )
  SELECT json_build_object(
    'comment', json_build_object(
      'id', cwp.id,
      'content', cwp.content,
      'content_id', cwp.content_id,
      'content_type', cwp.content_type,
      'user_id', cwp.user_id,
      'created_at', cwp.created_at,
      'updated_at', cwp.updated_at,
      'is_edited', cwp.is_edited,
      'parent_id', cwp.parent_id,
      'thread_id', cwp.thread_id
    ),
    'user', cwp.user_data
  )
  FROM comment_with_profile cwp
  INTO result;

  RETURN result;
END;
$$;

-- Update get_task_data to handle UUID properly
CREATE OR REPLACE FUNCTION public.get_task_data(task_slug TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  found_task tasks;
BEGIN
  -- First verify the task exists
  SELECT * INTO found_task
  FROM tasks
  WHERE slug = task_slug;

  IF found_task IS NULL THEN
    RAISE EXCEPTION 'Task not found with slug %', task_slug;
  END IF;

  -- Select directly into result without the extra row_to_json wrapper
  WITH task_comments AS (
    -- Subquery to get distinct comments with their user profiles
    SELECT DISTINCT ON (c.id)
      jsonb_build_object(
        'id', c.id,
        'content', c.content,
        'content_id', c.content_id,
        'content_type', c.content_type,
        'user_id', c.user_id,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'is_edited', c.is_edited,
        'parent_id', c.parent_id,
        'thread_id', c.thread_id,
        'user', to_jsonb(prof_c)
      ) as comment_data
    FROM comments c
    LEFT JOIN profiles prof_c ON c.user_id = prof_c.id
    WHERE c.content_id = found_task.id  -- Both are now UUID type
    AND c.content_type = 'task'
    ORDER BY c.id, c.created_at DESC
  )
  SELECT json_build_object(
    'task', t,
    'project', p,
    'subtasks', COALESCE(
      array_agg(s) FILTER (WHERE s.id IS NOT NULL), 
      ARRAY[]::subtasks[]
    ),
    'comments', COALESCE(
      (SELECT jsonb_agg(comment_data ORDER BY (comment_data->>'created_at') DESC)
       FROM task_comments),
      '[]'::jsonb
    ),
    'task_schedule', COALESCE(
      array_agg(ts) FILTER (WHERE ts.id IS NOT NULL),
      ARRAY[]::task_schedule[]
    ),
    'assignee_profile', prof
  ) INTO result
  FROM tasks t
  INNER JOIN projects p ON t.project_id = p.id
  LEFT JOIN subtasks s ON t.id = s.task_id
  LEFT JOIN task_schedule ts ON t.id = ts.task_id
  LEFT JOIN profiles prof ON t.assignee = prof.id
  WHERE t.slug = task_slug
  GROUP BY t.id, p.id, prof.id;

  RETURN result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_comment_data(TEXT, UUID, public.content_type, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_task_data(TEXT) TO authenticated;