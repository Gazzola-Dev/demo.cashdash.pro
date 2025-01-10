# My AI, Quest.

A chat bot web app that will proactively participate in your day, helping you to make the most of AI in your professional and personal life.

## Development set up:

1. Copy `.env.local.example` to `.env.local` and complete the details.
2. Run `npm i` and `npm run dev` in a terminal.
3. Use the auth form to create a user with an email magic link.
4. Run `makeAdmin [your@email.com]` and refresh the page.
5. Run `supabase login`, then `supabase link` and then `supabase db push`

### Supabase Migrations

1. Create a New Migration with `supabase migration [name_of_new_migration]`
2. Edit the migration file in SQL (use "add or replace" logic where possible).
3. Run the migrations with `supabase db push`.
4. Generate types from the db schema with `node generateTypes.ts`
5. If you have multiple migrations on your working branch, then combine (squash) them into a single migration before merging. Run `supabase db push` before and after squashing, you'll see an error the second time - use the revert commands shown in the error output. Then comment out the SQL in the squashed migration so you can run `supabase db push`. (Make sure to un-comment the SQL)
6. Before merging to `main`, run `node dateMigrations.js [name_of_first_new_migration]` - this will update the migration names to include the present time to avoid conflicts.

## Directory Structure

```
📁 app
├── 📄 layout.tsx               # Root layout - minimal setup, no data fetching
├── 📄 page.tsx                # Landing - static content only
│
├── 📁 (auth)
│   └── 📄 page.tsx            # Auth forms - Client component using auth hooks
│
└── 📁 (protected)
    ├── 📄 layout.tsx          # Protected layout - Server component
    │                          # - Fetch initial layout data (useLayoutData)
    │                          # - Provide data through Zustand store (useLayoutStore)
    │                          # - Child components use store selectors
    │
    ├── 📁 [project_slug]
    │   ├── 📄 page.tsx        # Project overview - Server component
    │   │                      # - Fetch project details (getProjectAction)
    │   │                      # - Client components use useQuery for live updates
    │   │
    │   ├── 📄 [...]/page.tsx  # Task view - Server component
    │   │                      # - Fetch task details (getTaskAction)
    │   │                      # - Client components use useQuery + mutations
    │   │
    │   ├── 📁 kanban
    │   │   └── 📄 page.tsx    # Kanban board - Client component
    │   │                      # - useQuery for task list with filters
    │   │                      # - useMutation for drag-n-drop updates
    │   │
    │   ├── 📁 tasks
    │   │   ├── 📄 page.tsx    # Task list - Server component
    │   │   │                  # - Initial task list fetch
    │   │   │                  # - Client components use useQuery + filters
    │   │   │
    │   │   └── 📄 new/page   # New task - Client component
    │   │                      # - Form with useMutation for creation
    │   │
    │   └── 📁 timeline
    │       └── 📄 page.tsx    # Timeline - Client component
    │                          # - useQuery for tasks with date filters
    │
    ├── 📁 settings/*          # Settings pages - Client components
    │   └── 📄 */page.tsx      # - useQuery + useMutation for preferences
    │
    └── 📁 projects
        ├── 📄 page.tsx        # Project list - Server component
        │                      # - Initial project list fetch
        │                      # - Client components use useQuery + filters
        │
        └── 📄 new/page.tsx    # New project - Client component
                               # - Form with useMutation for creation
📁 hooks/
├── 📄 layout.hooks.ts
├── 📄 project.hooks.ts
├── 📄 task.hooks.ts
├── 📄 user.hooks.ts
└── 📄 useRealtime.ts

📁 actions/
├── 📄 layout.actions.ts
├── 📄 project.actions.ts
├── 📄 task.actions.ts
└── 📄 user.actions.ts

📁 stores/
└── 📄 layout.store.ts

📁 types/
├── 📄 layout.types.ts
├── 📄 project.types.ts
├── 📄 task.types.ts
└── 📄 user.types.ts
```
