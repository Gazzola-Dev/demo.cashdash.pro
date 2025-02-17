import { Tables } from "@/types/database.types";
import { TaskResult } from "@/types/task.types";

const demoAdminUser: Tables<"profiles"> = {
  id: "admin-user-id",
  email: "admin@example.com",
  display_name: "Admin User",
  avatar_url: null,
  professional_title: "Project Administrator",
  bio: "Demo admin user for testing",
  github_username: "admin",
  timezone: "UTC",
  website: null,
  notification_preferences: null,
  ui_preferences: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  current_project_id: null,
};

const demoProjects: Tables<"projects">[] = [
  {
    id: "proj-1",
    name: "CashDash",
    description:
      "Desktop-first AI-powered project and task management platform",
    status: "active",
    slug: "cashdash",
    prefix: "CASH",
    github_repo_url: "https://github.com/org/cashdash",
    github_owner: "org",
    github_repo: "cashdash",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "proj-2",
    name: "Eco3D.shop",
    description: "Sustainable 3D printed products using biodegradable PHA",
    status: "active",
    slug: "eco3d-shop",
    prefix: "ECO",
    github_repo_url: "https://github.com/org/eco3d-shop",
    github_owner: "org",
    github_repo: "eco3d-shop",
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
  },
  {
    id: "proj-3",
    name: "Menu.run",
    description: "Mobile-first food delivery platform with real-time tracking",
    status: "active",
    slug: "menu-run",
    prefix: "MENU",
    github_repo_url: "https://github.com/org/menu-run",
    github_owner: "org",
    github_repo: "menu-run",
    created_at: "2024-03-01T00:00:00Z",
    updated_at: "2024-03-01T00:00:00Z",
  },
];

export const teamMembers: Tables<"profiles">[] = [
  {
    id: "user-1",
    email: "maya@example.com",
    display_name: "Maya Patel",
    avatar_url: null,
    professional_title: "AI/ML Engineer",
    bio: "Specialized in ML models and AI integration",
    github_username: "mayatech",
    timezone: "UTC",
    website: null,
    notification_preferences: null,
    ui_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_project_id: "proj-1",
  },
  {
    id: "user-2",
    email: "lucas@example.com",
    display_name: "Lucas Green",
    avatar_url: null,
    professional_title: "3D Design Engineer",
    bio: "Sustainable materials expert and 3D printing specialist",
    github_username: "lucasgreen",
    timezone: "UTC",
    website: null,
    notification_preferences: null,
    ui_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_project_id: "proj-2",
  },
  {
    id: "user-3",
    email: "sofia@example.com",
    display_name: "Sofia Martinez",
    avatar_url: null,
    professional_title: "Mobile UX Designer",
    bio: "Mobile-first design expert with restaurant industry experience",
    github_username: "sofiamartinez",
    timezone: "UTC",
    website: null,
    notification_preferences: null,
    ui_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_project_id: "proj-3",
  },
];

const PROJECT_1_TASKS: TaskResult[] = [
  {
    task: {
      id: "task-1-1",
      title: "Implement AI Task Prioritization Engine",
      description:
        "Create ML model for intelligent task prioritization based on user behavior and project deadlines",
      status: "completed",
      priority: "high",
      project_id: "proj-1",
      assignee: "user-1",
      prefix: "CASH",
      slug: "cash-1",
      ordinal_id: 1,
      budget_cents: 800000,
      created_at: "2024-01-05T00:00:00Z",
      updated_at: "2024-01-20T00:00:00Z",
    },
    subtasks: [
      {
        id: "subtask-1-1-1",
        title: "Train Initial ML Model",
        description: "Train model on historical project data",
        status: "completed",
        task_id: "task-1-1",
        ordinal_id: 1,
        budget_cents: 300000,
        created_at: "2024-01-05T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      },
      {
        id: "subtask-1-1-2",
        title: "Implement Real-time Predictions",
        description: "Deploy model with real-time prediction capabilities",
        status: "completed",
        task_id: "task-1-1",
        ordinal_id: 2,
        budget_cents: 250000,
        created_at: "2024-01-16T00:00:00Z",
        updated_at: "2024-01-20T00:00:00Z",
      },
    ],
    comments: [
      {
        id: "comment-1-1-1",
        content: "Initial model showing 89% accuracy in priority predictions",
        content_id: "task-1-1",
        content_type: "task",
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
        is_edited: false,
        user_id: "user-1",
        parent_id: null,
        thread_id: null,
        user: {
          id: "user-1",
          display_name: "Maya Patel",
          avatar_url: null,
          professional_title: "AI/ML Engineer",
        },
      },
    ],
    task_schedule: {
      id: "schedule-1-1",
      task_id: "task-1-1",
      start_date: "2024-01-05T00:00:00Z",
      due_date: "2024-01-20T00:00:00Z",
      estimated_hours: 40,
      actual_hours: 35,
      completed_at: "2024-01-20T00:00:00Z",
    },
    assignee_profile: teamMembers[0],
    project: demoProjects[0],
  },
  {
    task: {
      id: "task-1-2",
      title: "Desktop App Performance Optimization",
      description: "Optimize Electron app performance and reduce memory usage",
      status: "in_progress",
      priority: "high",
      project_id: "proj-1",
      assignee: "user-1",
      prefix: "CASH",
      slug: "cash-2",
      ordinal_id: 2,
      budget_cents: 600000,
      created_at: "2024-01-21T00:00:00Z",
      updated_at: "2024-01-21T00:00:00Z",
    },
    subtasks: [
      {
        id: "subtask-1-2-1",
        title: "Memory Profiling",
        description: "Profile app memory usage patterns",
        status: "completed",
        task_id: "task-1-2",
        ordinal_id: 1,
        budget_cents: 200000,
        created_at: "2024-01-21T00:00:00Z",
        updated_at: "2024-01-25T00:00:00Z",
      },
    ],
    comments: [
      {
        id: "comment-1-2-1",
        content: "Identified memory leak in ML model caching",
        content_id: "task-1-2",
        content_type: "task",
        created_at: "2024-01-25T00:00:00Z",
        updated_at: "2024-01-25T00:00:00Z",
        is_edited: false,
        user_id: "user-1",
        parent_id: null,
        thread_id: null,
        user: {
          id: "user-1",
          display_name: "Maya Patel",
          avatar_url: null,
          professional_title: "AI/ML Engineer",
        },
      },
    ],
    task_schedule: {
      id: "schedule-1-2",
      task_id: "task-1-2",
      start_date: "2024-01-21T00:00:00Z",
      due_date: "2024-02-15T00:00:00Z",
      estimated_hours: 35,
      actual_hours: 15,
      completed_at: null,
    },
    assignee_profile: teamMembers[0],
    project: demoProjects[0],
  },
];

const PROJECT_2_TASKS: TaskResult[] = [
  {
    task: {
      id: "task-2-1",
      title: "PHA Material Testing",
      description: "Conduct comprehensive testing of new PHA material batches",
      status: "completed",
      priority: "high",
      project_id: "proj-2",
      assignee: "user-2",
      prefix: "ECO",
      slug: "eco-1",
      ordinal_id: 1,
      budget_cents: 900000,
      created_at: "2024-02-01T00:00:00Z",
      updated_at: "2024-02-15T00:00:00Z",
    },
    subtasks: [
      {
        id: "subtask-2-1-1",
        title: "Temperature Resistance Testing",
        description: "Test PHA material behavior at various temperatures",
        status: "completed",
        task_id: "task-2-1",
        ordinal_id: 1,
        budget_cents: 400000,
        created_at: "2024-02-01T00:00:00Z",
        updated_at: "2024-02-10T00:00:00Z",
      },
      {
        id: "subtask-2-1-2",
        title: "Biodegradation Analysis",
        description: "Analyze biodegradation rates in different conditions",
        status: "completed",
        task_id: "task-2-1",
        ordinal_id: 2,
        budget_cents: 500000,
        created_at: "2024-02-10T00:00:00Z",
        updated_at: "2024-02-15T00:00:00Z",
      },
    ],
    comments: [
      {
        id: "comment-2-1-1",
        content: "New PHA batch shows 30% faster biodegradation rate",
        content_id: "task-2-1",
        content_type: "task",
        created_at: "2024-02-15T00:00:00Z",
        updated_at: "2024-02-15T00:00:00Z",
        is_edited: false,
        user_id: "user-2",
        parent_id: null,
        thread_id: null,
        user: {
          id: "user-2",
          display_name: "Lucas Green",
          avatar_url: null,
          professional_title: "3D Design Engineer",
        },
      },
    ],
    task_schedule: {
      id: "schedule-2-1",
      task_id: "task-2-1",
      start_date: "2024-02-01T00:00:00Z",
      due_date: "2024-02-15T00:00:00Z",
      estimated_hours: 45,
      actual_hours: 42,
      completed_at: "2024-02-15T00:00:00Z",
    },
    assignee_profile: teamMembers[1],
    project: demoProjects[1],
  },
];

const PROJECT_3_TASKS: TaskResult[] = [
  {
    task: {
      id: "task-3-1",
      title: "Real-time Delivery Tracking UI",
      description:
        "Implement real-time delivery tracking interface with map integration",
      status: "in_progress",
      priority: "high",
      project_id: "proj-3",
      assignee: "user-3",
      prefix: "MENU",
      slug: "menu-1",
      ordinal_id: 1,
      budget_cents: 700000,
      created_at: "2024-03-01T00:00:00Z",
      updated_at: "2024-03-10T00:00:00Z",
    },
    subtasks: [
      {
        id: "subtask-3-1-1",
        title: "Map Integration",
        description: "Integrate real-time mapping service",
        status: "completed",
        task_id: "task-3-1",
        ordinal_id: 1,
        budget_cents: 300000,
        created_at: "2024-03-01T00:00:00Z",
        updated_at: "2024-03-05T00:00:00Z",
      },
      {
        id: "subtask-3-1-2",
        title: "Driver Location Updates",
        description: "Implement real-time driver location updates",
        status: "in_progress",
        task_id: "task-3-1",
        ordinal_id: 2,
        budget_cents: 400000,
        created_at: "2024-03-06T00:00:00Z",
        updated_at: "2024-03-10T00:00:00Z",
      },
    ],
    comments: [
      {
        id: "comment-3-1-1",
        content:
          "Map integration complete, testing with sample delivery routes",
        content_id: "task-3-1",
        content_type: "task",
        created_at: "2024-03-05T00:00:00Z",
        updated_at: "2024-03-05T00:00:00Z",
        is_edited: false,
        user_id: "user-3",
        parent_id: null,
        thread_id: null,
        user: {
          id: "user-3",
          display_name: "Sofia Martinez",
          avatar_url: null,
          professional_title: "Mobile UX Designer",
        },
      },
    ],
    task_schedule: {
      id: "schedule-3-1",
      task_id: "task-3-1",
      start_date: "2024-03-01T00:00:00Z",
      due_date: "2024-03-20T00:00:00Z",
      estimated_hours: 40,
      actual_hours: 25,
      completed_at: null,
    },
    assignee_profile: teamMembers[2],
    project: demoProjects[2],
  },
  {
    task: {
      id: "task-3-2",
      title: "Restaurant Partner Dashboard",
      description:
        "Create mobile-responsive dashboard for restaurant partners to manage orders and menu items",
      status: "in_progress",
      priority: "medium",
      project_id: "proj-3",
      assignee: "user-3",
      prefix: "MENU",
      slug: "menu-2",
      ordinal_id: 2,
      budget_cents: 600000,
      created_at: "2024-03-08T00:00:00Z",
      updated_at: "2024-03-15T00:00:00Z",
    },
    subtasks: [
      {
        id: "subtask-3-2-1",
        title: "Menu Management Interface",
        description: "Build interface for real-time menu updates",
        status: "completed",
        task_id: "task-3-2",
        ordinal_id: 1,
        budget_cents: 250000,
        created_at: "2024-03-08T00:00:00Z",
        updated_at: "2024-03-12T00:00:00Z",
      },
      {
        id: "subtask-3-2-2",
        title: "Order Management System",
        description: "Implement real-time order tracking and management",
        status: "in_progress",
        task_id: "task-3-2",
        ordinal_id: 2,
        budget_cents: 350000,
        created_at: "2024-03-13T00:00:00Z",
        updated_at: "2024-03-15T00:00:00Z",
      },
    ],
    comments: [
      {
        id: "comment-3-2-1",
        content:
          "Menu management module ready for testing with restaurant partners",
        content_id: "task-3-2",
        content_type: "task",
        created_at: "2024-03-12T00:00:00Z",
        updated_at: "2024-03-12T00:00:00Z",
        is_edited: false,
        user_id: "user-3",
        parent_id: null,
        thread_id: null,
        user: {
          id: "user-3",
          display_name: "Sofia Martinez",
          avatar_url: null,
          professional_title: "Mobile UX Designer",
        },
      },
    ],
    task_schedule: {
      id: "schedule-3-2",
      task_id: "task-3-2",
      start_date: "2024-03-08T00:00:00Z",
      due_date: "2024-03-25T00:00:00Z",
      estimated_hours: 35,
      actual_hours: 20,
      completed_at: null,
    },
    assignee_profile: teamMembers[2],
    project: demoProjects[2],
  },
];

export const demoData = {
  adminUser: demoAdminUser,
  projects: demoProjects,
  teamMembers: teamMembers,
  tasks: {
    project1: PROJECT_1_TASKS,
    project2: PROJECT_2_TASKS,
    project3: PROJECT_3_TASKS,
  },
};
