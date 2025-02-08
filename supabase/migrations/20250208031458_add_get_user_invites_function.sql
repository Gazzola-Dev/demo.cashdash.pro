CREATE OR REPLACE FUNCTION public.get_user_invites(p_email TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'invitations', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', pi.id,
          'project_id', pi.project_id,
          'email', pi.email,
          'role', pi.role,
          'status', pi.status,
          'created_at', pi.created_at,
          'expires_at', pi.expires_at,
          'project', jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'slug', p.slug,
            'prefix', p.prefix,
            'status', p.status
          ),
          'inviter', jsonb_build_object(
            'id', prof.id,
            'display_name', prof.display_name,
            'avatar_url', prof.avatar_url,
            'professional_title', prof.professional_title,
            'email', prof.email
          )
        )
      ) FILTER (WHERE pi.id IS NOT NULL),
      '[]'::jsonb
    )
  )::json INTO result
  FROM project_invitations pi
  INNER JOIN projects p ON pi.project_id = p.id
  LEFT JOIN profiles prof ON pi.invited_by = prof.id
  WHERE pi.email = p_email
  AND pi.status = 'pending';

  RETURN result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_invites(TEXT) TO authenticated;