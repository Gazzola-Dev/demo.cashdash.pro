-- Ensure content_type enum includes all required content types
ALTER TYPE public.content_type ADD VALUE IF NOT EXISTS 'milestone' AFTER 'task';

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    content_type public.content_type NOT NULL,
    message TEXT NOT NULL,
    seen BOOLEAN NOT NULL DEFAULT false,
    url_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for querying user's notifications
CREATE INDEX idx_notifications_recipient_seen ON public.notifications(recipient_id, seen);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Create trigger function to validate content references
CREATE OR REPLACE FUNCTION public.validate_notification_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    CASE NEW.content_type
        WHEN 'project' THEN
            IF NOT EXISTS (SELECT 1 FROM projects WHERE id = NEW.content_id) THEN
                RAISE EXCEPTION 'Invalid project reference';
            END IF;
        WHEN 'task' THEN
            IF NOT EXISTS (SELECT 1 FROM tasks WHERE id = NEW.content_id) THEN
                RAISE EXCEPTION 'Invalid task reference';
            END IF;
        WHEN 'subtask' THEN
            IF NOT EXISTS (SELECT 1 FROM subtasks WHERE id = NEW.content_id) THEN
                RAISE EXCEPTION 'Invalid subtask reference';
            END IF;
        WHEN 'comment' THEN
            IF NOT EXISTS (SELECT 1 FROM comments WHERE id = NEW.content_id) THEN
                RAISE EXCEPTION 'Invalid comment reference';
            END IF;
        WHEN 'milestone' THEN
            IF NOT EXISTS (SELECT 1 FROM milestones WHERE id = NEW.content_id) THEN
                RAISE EXCEPTION 'Invalid milestone reference';
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid content type';
    END CASE;
    
    RETURN NEW;
END;
$$;

-- Create trigger for content validation
CREATE TRIGGER validate_notification_content_trigger
    BEFORE INSERT OR UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_notification_content();

-- Set up Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT TO authenticated
    USING (recipient_id = auth.uid());

-- Users can only update seen status of their own notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE TO authenticated
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

-- Function to mark all notifications as seen for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_seen(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE notifications
    SET seen = true
    WHERE recipient_id = p_user_id
    AND seen = false;
END;
$$;

-- Function to create a new notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_recipient_id UUID,
    p_content_id UUID,
    p_content_type public.content_type,
    p_message TEXT,
    p_url_path TEXT DEFAULT NULL
)
RETURNS notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_notification notifications;
BEGIN
    INSERT INTO notifications (
        recipient_id,
        content_id,
        content_type,
        message,
        url_path
    )
    VALUES (
        p_recipient_id,
        p_content_id,
        p_content_type,
        p_message,
        p_url_path
    )
    RETURNING * INTO new_notification;

    RETURN new_notification;
END;
$$;

-- Grant permissions
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_seen TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_notification_content TO authenticated;