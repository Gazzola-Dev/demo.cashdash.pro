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
BEGIN
  -- Insert the comment and return it with the user profile data
  WITH new_comment AS (
    INSERT INTO comments (
      content,
      content_id,
      content_type,
      user_id
    )
    VALUES (
      comment_content,
      content_id,
      content_type,
      user_id
    )
    RETURNING *
  )
  SELECT json_build_object(
    'comment', c,
    'user', prof
  ) INTO result
  FROM new_comment c
  LEFT JOIN profiles prof ON c.user_id = prof.id;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_comment_data(TEXT, UUID, public.content_type, UUID) TO authenticated;