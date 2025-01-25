-- Migration name: 20250125123456_add_update_comment_func.sql

CREATE OR REPLACE FUNCTION public.update_comment_data(
  comment_id UUID,
  comment_content TEXT,
  user_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  comment_record comments;
BEGIN
  -- First verify the comment exists and belongs to the user
  SELECT * INTO comment_record
  FROM comments
  WHERE id = comment_id;

  IF comment_record IS NULL THEN
    RAISE EXCEPTION 'Comment not found with id %', comment_id;
  END IF;

  IF comment_record.user_id != user_id THEN
    RAISE EXCEPTION 'User % is not authorized to update comment %', user_id, comment_id;
  END IF;

  -- Update the comment
  UPDATE comments
  SET 
    content = comment_content,
    updated_at = now(),
    is_edited = true
  WHERE id = comment_id
  RETURNING * INTO comment_record;

  -- Build the response with user profile data
  WITH comment_with_profile AS (
    SELECT 
      c.*,
      to_jsonb(p.*) AS user_data
    FROM comments c
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.id = comment_record.id
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.update_comment_data(UUID, TEXT, UUID) TO authenticated;