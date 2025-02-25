# Cash Dash Pro

Cash Dash Pro is a developer-focused task management platform that integrates GitHub activity with financial tracking, providing real-time insights into project progress, budget alignment, and development metrics through AI-powered analysis.

## Features

- **Authentication** using Supabase with email magic links
- **Project management** with GitHub repository integration
- **Task management** system including creation, editing, deletion, and status updates
- **Task organization** with priority levels and assignees
- **Team collaboration** with role-based access control
- **Financial tracking** with Upwork contract/milestone integration
- **Progress visualization** with budget vs. progress metrics
- **GitHub integration** for commit and PR status tracking
- **AI-powered analysis** for progress estimation

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: Zustand, React Query (TanStack Query)
- **Authentication**: Supabase Auth with magic links
- **Styling**: Tailwind CSS with shadcn/ui components
- **API**: Server Actions

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/cash-dash-pro.git
   cd cash-dash-pro
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables (see `.env.local.example` for reference):

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SESSION_ID_KEY=your_session_id_key
   SMTP_API_KEY=your_smtp_api_key
   NEXT_PUBLIC_CLIENT_DEBUG=true/false
   SERVER_DEBUG=true/false
   NEXT_PUBLIC_VERBOSE_LOGS=true/false
   ```

4. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
cash-dash-pro/
├── app/                    # Next.js app directory
│   ├── [project_slug]/     # Dynamic project routes
│   ├── settings/           # User settings pages
│   ├── auth/               # Authentication pages
│   ├── layout.tsx          # Root layout component
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── ai/                 # AI-related components
│   ├── dashboard/          # Dashboard components
│   ├── home/               # Home page components
│   ├── layout/             # Layout components
│   ├── projects/           # Project-related components
│   ├── shared/             # Shared components
│   ├── SVG/                # SVG components
│   ├── tasks/              # Task-related components
│   └── ui/                 # UI components (shadcn)
├── actions/                # Server actions
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── providers/              # React context providers
├── stores/                 # Zustand stores
├── styles/                 # CSS styles
├── types/                  # TypeScript type definitions
├── public/                 # Static files
└── supabase/               # Supabase migrations
```

## Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:

- **profiles**: User profiles linked to Supabase auth
- **projects**: Project management
- **tasks**: Task management
- **subtasks**: Subtask management for tasks
- **project_members**: Project team members
- **project_invitations**: Project invitations
- **comments**: Task comments
- **contracts**: Upwork contracts
- **contract_milestones**: Milestones for contracts

## Development Patterns

### File Naming Conventions

- React components: `PascalCase.tsx`
- Hooks, actions, and types: `[type]/[table].[type].(ts|tsx)`

### Data Management

- Database interactions are performed in server actions
- `react-query` (TanStack Query) is used for data fetching
- `useQuery` for read operations, `useMutation` for write operations
- Zustand for client-side state management

## Testing

Run tests using Cypress:

```bash
npx cypress open
```

## Deployment

The application can be deployed to Vercel or any hosting provider that supports Next.js applications.

1. Set up environment variables on your hosting provider.
2. Deploy the application using the hosting provider's deployment process.

## License

[MIT License](LICENSE)

## Contributors

- Aaron Gazzola - Creator and Lead Developer

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [TanStack Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
