-- Custom Types
CREATE TYPE public.project_status AS ENUM ('active', 'archived', 'completed');
CREATE TYPE public.task_status AS ENUM ('backlog', 'todo', 'in_progress', 'in_review', 'completed');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE public.content_type AS ENUM ('project', 'task', 'subtask', 'comment');

-- Projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    description JSONB, -- Rich text content stored as JSON
    status project_status NOT NULL DEFAULT 'active',
    slug TEXT NOT NULL UNIQUE,
    prefix TEXT NOT NULL,
    github_repo_url TEXT,
    github_owner TEXT,
    github_repo TEXT
);

-- Tasks table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    ordinal_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description JSONB, -- Rich text content stored as JSON
    status task_status NOT NULL DEFAULT 'backlog',
    priority task_priority NOT NULL DEFAULT 'medium',
    slug TEXT NOT NULL,
    prefix TEXT NOT NULL,
    assignee UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    budget_cents INTEGER,
    UNIQUE(project_id, slug),
    UNIQUE(project_id, ordinal_id)
);

-- Subtasks table (for milestone-style tracking)
CREATE TABLE public.subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    ordinal_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description JSONB,
    status task_status NOT NULL DEFAULT 'backlog',
    budget_cents INTEGER,
    UNIQUE(task_id, ordinal_id)
);

-- Tags table
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL
);

-- Task tags junction table
CREATE TABLE public.task_tags (
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

-- Project members and invitations
CREATE TABLE public.project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    UNIQUE(project_id, user_id)
);

CREATE TABLE public.project_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    status invitation_status NOT NULL DEFAULT 'pending',
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    UNIQUE(project_id, email)
);

-- Comments system with threading and reactions
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    content_type public.content_type NOT NULL,
    content_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content JSONB NOT NULL, -- Rich text content stored as JSON
    is_edited BOOLEAN NOT NULL DEFAULT false,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    thread_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    CONSTRAINT valid_thread CHECK (
        (parent_id IS NULL AND thread_id IS NULL) OR
        (parent_id IS NOT NULL AND thread_id IS NOT NULL)
    )
);

-- Comment reactions
CREATE TABLE public.comment_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL,
    UNIQUE(comment_id, user_id, reaction)
);

-- File attachments
CREATE TABLE public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    content_type public.content_type NOT NULL,
    content_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Task scheduling and timeline
CREATE TABLE public.task_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2),
    CONSTRAINT valid_schedule_dates CHECK (start_date <= due_date)
);

-- Analytics and metrics
CREATE TABLE public.project_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    burn_rate_cents INTEGER,
    velocity DECIMAL(10,2),
    completion_percentage DECIMAL(5,2),
    UNIQUE(project_id, date)
);

-- External integrations
CREATE TABLE public.external_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    credentials JSONB,
    settings JSONB,
    UNIQUE(project_id, provider)
);

-- Activity logging
CREATE TABLE public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    metadata JSONB
);

-- Trigger function for ordinal IDs
CREATE OR REPLACE FUNCTION public.set_task_ordinal_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT COALESCE(MAX(ordinal_id), 0) + 1
    INTO NEW.ordinal_id
    FROM public.tasks
    WHERE project_id = NEW.project_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_task_ordinal_id_trigger
    BEFORE INSERT ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.set_task_ordinal_id();

-- Similar trigger for subtasks
CREATE OR REPLACE FUNCTION public.set_subtask_ordinal_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT COALESCE(MAX(ordinal_id), 0) + 1
    INTO NEW.ordinal_id
    FROM public.subtasks
    WHERE task_id = NEW.task_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_subtask_ordinal_id_trigger
    BEFORE INSERT ON public.subtasks
    FOR EACH ROW
    EXECUTE FUNCTION public.set_subtask_ordinal_id();

-- Updated timestamp trigger (kept from original)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers for all tables
CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add more updated_at triggers for other tables...

-- RLS Policies (expanded version needed for new tables)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Add appropriate RLS policies for each table...
-- (Previous RLS policies would need to be updated for the new schema)

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Revoke public permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;