import { Tables } from "@/types/database.types";

export const demoAdminProfile: Tables<"profiles"> = {
  id: "admin-user-id",
  email: "admin@example.com",
  display_name: "Admin User (That's you!)",
  avatar_url: null,
  professional_title: "Project Administrator",
  bio: "Just a terrific Administrator!",
  github_username: "admin",
  timezone: "UTC",
  website: null,
  notification_preferences: null,
  ui_preferences: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  current_project_id: null,
};

export const project1Notifications: Tables<"notifications">[] = [
  {
    id: "notif-1-1",
    content_id: "task-1-1",
    content_type: "task",
    recipient_id: demoAdminProfile.id,
    message: "GO-1: AI Task Prioritization Engine is ready for review",
    created_at: "2024-01-15T08:00:00Z",
    seen: false,
    url_path: "/go-task/go-1",
  },
  {
    id: "notif-1-2",
    content_id: "task-1-2",
    content_type: "task",
    recipient_id: demoAdminProfile.id,
    message: "GO-2: Desktop App Performance Optimization requires attention",
    created_at: "2024-01-21T09:30:00Z",
    seen: false,
    url_path: "/go-task/go-2",
  },
];

export const project2Notifications: Tables<"notifications">[] = [
  {
    id: "notif-2-1",
    content_id: "task-2-1",
    content_type: "task",
    recipient_id: demoAdminProfile.id,
    message: "ECO-1: PHA Material Testing results are ready for review",
    created_at: "2024-02-15T14:20:00Z",
    seen: true,
    url_path: "/eco3d-shop/eco-1",
  },
  {
    id: "notif-2-2",
    content_id: "task-2-2",
    content_type: "task",
    recipient_id: demoAdminProfile.id,
    message: "ECO-2: 3D Printer Calibration requires immediate attention",
    created_at: "2024-02-19T11:45:00Z",
    seen: false,
    url_path: "/eco3d-shop/eco-2",
  },
  {
    id: "notif-2-3",
    content_id: "proj-2",
    content_type: "project",
    recipient_id: demoAdminProfile.id,
    message: "New team member Lucas Green joined Eco3D.shop",
    created_at: "2024-02-01T10:00:00Z",
    seen: true,
    url_path: "/eco3d-shop",
  },
];

export const project3Notifications: Tables<"notifications">[] = [
  {
    id: "notif-3-1",
    content_id: "task-3-1",
    content_type: "task",
    recipient_id: demoAdminProfile.id,
    message: "MENU-1: Real-time Delivery Tracking UI implementation started",
    created_at: "2024-03-01T15:30:00Z",
    seen: false,
    url_path: "/menu-run/menu-1",
  },
  {
    id: "notif-3-2",
    content_id: "task-3-2",
    content_type: "task",
    recipient_id: demoAdminProfile.id,
    message: "MENU-2: Restaurant Partner Dashboard is ready for testing",
    created_at: "2024-03-12T16:45:00Z",
    seen: false,
    url_path: "/menu-run/menu-2",
  },
  {
    id: "notif-3-3",
    content_id: "proj-3",
    content_type: "project",
    recipient_id: demoAdminProfile.id,
    message: "Menu.run project milestone: MVP features completed",
    created_at: "2024-03-15T09:15:00Z",
    seen: true,
    url_path: "/menu-run",
  },
];

export const demoProjects: Tables<"projects">[] = [
  {
    id: "proj-1",
    name: "GoTask.wow",
    description:
      "Desktop-first AI-powered project and task management platform",
    status: "active",
    slug: "go-task",
    prefix: "GO",
    github_repo_url: "https://github.com/org/gotaask",
    github_owner: "org",
    github_repo: "gotask",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    icon_name: "lucide:circle-check-big",
    icon_color_fg: "#BFDBFE", // blue-200
    icon_color_bg: "#1E3A8A", // blue-900
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
    icon_name: "lucide:leaf",
    icon_color_fg: "#166534", // green-800
    icon_color_bg: "#F0FDF4", // green-100
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
    icon_name: "lucide:pizza",
    icon_color_fg: "#9A3412", // orange-800
    icon_color_bg: "#FFF7ED", // orange-50
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
  {
    id: "user-4",
    email: "aiden@example.com",
    display_name: "Aiden Chen",
    avatar_url: null,
    professional_title: "Backend Developer",
    bio: "Distributed systems and cloud infrastructure specialist",
    github_username: "aidenchen",
    timezone: "UTC",
    website: null,
    notification_preferences: null,
    ui_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_project_id: "proj-4",
  },
  {
    id: "user-5",
    email: "emma@example.com",
    display_name: "Emma Wilson",
    avatar_url: null,
    professional_title: "Product Manager",
    bio: "Strategy and growth expert with fintech background",
    github_username: "emmawilson",
    timezone: "UTC",
    website: null,
    notification_preferences: null,
    ui_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_project_id: "proj-5",
  },
  {
    id: "user-6",
    email: "raj@example.com",
    display_name: "Raj Kumar",
    avatar_url: null,
    professional_title: "DevOps Engineer",
    bio: "Automation and CI/CD pipeline expert",
    github_username: "rajkumar",
    timezone: "UTC",
    website: null,
    notification_preferences: null,
    ui_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_project_id: "proj-6",
  },
  {
    id: "user-7",
    email: "sarah@example.com",
    display_name: "Sarah Johnson",
    avatar_url: null,
    professional_title: "Security Engineer",
    bio: "Application security and threat modeling specialist",
    github_username: "sarahj",
    timezone: "UTC",
    website: null,
    notification_preferences: null,
    ui_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_project_id: "proj-7",
  },
  {
    id: "user-8",
    email: "marco@example.com",
    display_name: "Marco Rossi",
    avatar_url: null,
    professional_title: "Frontend Developer",
    bio: "Performance optimization and accessibility expert",
    github_username: "marcorossi",
    timezone: "UTC",
    website: null,
    notification_preferences: null,
    ui_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_project_id: "proj-8",
  },
  {
    id: "user-9",
    email: "ana@example.com",
    display_name: "Ana Silva",
    avatar_url: null,
    professional_title: "Data Scientist",
    bio: "Statistical analysis and predictive modeling expert",
    github_username: "anasilva",
    timezone: "UTC",
    website: null,
    notification_preferences: null,
    ui_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_project_id: "proj-9",
  },
  {
    id: "user-10",
    email: "james@example.com",
    display_name: "James Thompson",
    avatar_url: null,
    professional_title: "QA Engineer",
    bio: "Test automation and quality assurance specialist",
    github_username: "jamest",
    timezone: "UTC",
    website: null,
    notification_preferences: null,
    ui_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_project_id: "proj-10",
  },
  {
    id: "user-11",
    email: "nina@example.com",
    display_name: "Nina Petrova",
    avatar_url: null,
    professional_title: "Systems Architect",
    bio: "Enterprise architecture and system design expert",
    github_username: "ninap",
    timezone: "UTC",
    website: null,
    notification_preferences: null,
    ui_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_project_id: "proj-11",
  },
  {
    id: "user-12",
    email: "david@example.com",
    display_name: "David Kim",
    avatar_url: null,
    professional_title: "UI Developer",
    bio: "Component design and design system specialist",
    github_username: "davidk",
    timezone: "UTC",
    website: null,
    notification_preferences: null,
    ui_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_project_id: "proj-12",
  },
  {
    id: "user-13",
    email: "olivia@example.com",
    display_name: "Olivia Brown",
    avatar_url: null,
    professional_title: "Technical Writer",
    bio: "API documentation and developer education specialist",
    github_username: "oliviab",
    timezone: "UTC",
    website: null,
    notification_preferences: null,
    ui_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_project_id: "proj-13",
  },
  {
    id: "user-14",
    email: "hassan@example.com",
    display_name: "Hassan Ahmed",
    avatar_url: null,
    professional_title: "Database Engineer",
    bio: "Database optimization and data modeling expert",
    github_username: "hassana",
    timezone: "UTC",
    website: null,
    notification_preferences: null,
    ui_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_project_id: "proj-14",
  },
  {
    id: "user-15",
    email: "yuki@example.com",
    display_name: "Yuki Tanaka",
    avatar_url: null,
    professional_title: "Mobile Developer",
    bio: "Cross-platform mobile development specialist",
    github_username: "yukit",
    timezone: "UTC",
    website: null,
    notification_preferences: null,
    ui_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_project_id: "proj-15",
  },
];
const PROJECT_1_TASKS = [
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
      prefix: "GO",
      slug: "go-1",
      ordinal_id: 1,
      ordinal_priority: 1,
      budget_cents: 800000,
      estimated_minutes: 2400,
      recorded_minutes: 2100,
      start_time: 1706227200,
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
      prefix: "GO",
      slug: "go-2",
      ordinal_id: 2,
      ordinal_priority: 2,
      budget_cents: 600000,
      estimated_minutes: 2100,
      recorded_minutes: 900,
      start_time: 1706313600,
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

const PROJECT_2_TASKS = [
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
      ordinal_priority: 1,
      budget_cents: 900000,
      estimated_minutes: 2700,
      recorded_minutes: 2520,
      start_time: 1706918400,
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
  {
    task: {
      id: "task-2-2",
      title: "3D Printer Calibration for PHA",
      description:
        "Optimize printer settings for new PHA material, including temperature profiles and extrusion rates",
      status: "in_progress",
      priority: "urgent",
      project_id: "proj-2",
      assignee: "user-2",
      prefix: "ECO",
      slug: "eco-2",
      ordinal_id: 2,
      ordinal_priority: 2,
      budget_cents: 750000,
      estimated_minutes: 2400,
      recorded_minutes: 1500,
      start_time: 1707004800,
      created_at: "2024-02-16T00:00:00Z",
      updated_at: "2024-02-20T00:00:00Z",
    },
    subtasks: [
      {
        id: "subtask-2-2-1",
        title: "Temperature Profile Optimization",
        description:
          "Create and test temperature profiles for different print speeds",
        status: "completed",
        task_id: "task-2-2",
        ordinal_id: 1,
        budget_cents: 300000,
        created_at: "2024-02-16T00:00:00Z",
        updated_at: "2024-02-18T00:00:00Z",
      },
      {
        id: "subtask-2-2-2",
        title: "Extrusion Rate Testing",
        description:
          "Test various extrusion rates to prevent material degradation",
        status: "in_progress",
        task_id: "task-2-2",
        ordinal_id: 2,
        budget_cents: 450000,
        created_at: "2024-02-19T00:00:00Z",
        updated_at: "2024-02-20T00:00:00Z",
      },
    ],
    comments: [
      {
        id: "comment-2-2-1",
        content: "Initial temperature profiles show optimal printing at 185°C",
        content_id: "task-2-2",
        content_type: "task",
        created_at: "2024-02-18T00:00:00Z",
        updated_at: "2024-02-18T00:00:00Z",
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
      id: "schedule-2-2",
      task_id: "task-2-2",
      start_date: "2024-02-16T00:00:00Z",
      due_date: "2024-02-28T00:00:00Z",
      estimated_hours: 40,
      actual_hours: 25,
      completed_at: null,
    },
    assignee_profile: teamMembers[1],
    project: demoProjects[1],
  },
  {
    task: {
      id: "task-2-3",
      title: "Product Prototype Development",
      description:
        "Design and print initial prototypes using calibrated PHA settings",
      status: "todo",
      priority: "medium",
      project_id: "proj-2",
      assignee: "user-2",
      prefix: "ECO",
      slug: "eco-3",
      ordinal_id: 3,
      ordinal_priority: 3,
      budget_cents: 600000,
      estimated_minutes: 2100,
      recorded_minutes: 0,
      start_time: null,
      created_at: "2024-02-20T00:00:00Z",
      updated_at: "2024-02-20T00:00:00Z",
    },
    subtasks: [
      {
        id: "subtask-2-3-1",
        title: "Design Product Models",
        description: "Create 3D models for initial product line",
        status: "todo",
        task_id: "task-2-3",
        ordinal_id: 1,
        budget_cents: 250000,
        created_at: "2024-02-20T00:00:00Z",
        updated_at: "2024-02-20T00:00:00Z",
      },
      {
        id: "subtask-2-3-2",
        title: "Print Test Products",
        description: "Print and evaluate initial product prototypes",
        status: "todo",
        task_id: "task-2-3",
        ordinal_id: 2,
        budget_cents: 350000,
        created_at: "2024-02-20T00:00:00Z",
        updated_at: "2024-02-20T00:00:00Z",
      },
    ],
    comments: [],
    task_schedule: {
      id: "schedule-2-3",
      task_id: "task-2-3",
      start_date: "2024-03-01T00:00:00Z",
      due_date: "2024-03-15T00:00:00Z",
      estimated_hours: 35,
      actual_hours: 0,
      completed_at: null,
    },
    assignee_profile: teamMembers[1],
    project: demoProjects[1],
  },
];

const PROJECT_3_TASKS = [
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
      ordinal_priority: 1,
      budget_cents: 700000,
      estimated_minutes: 2400,
      recorded_minutes: 1500,
      start_time: 1709251200,
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
      ordinal_priority: 2,
      budget_cents: 600000,
      estimated_minutes: 2100,
      recorded_minutes: 1200,
      start_time: 1709856000,
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
  adminProfile: demoAdminProfile,
  projects: demoProjects,
  notifications: {
    project1: project1Notifications,
    project2: project2Notifications,
    project3: project3Notifications,
  },
  teamMembers,
  tasks: {
    project1: PROJECT_1_TASKS,
    project2: PROJECT_2_TASKS,
    project3: PROJECT_3_TASKS,
  },
};

export const allTaskSlugs = Object.values(demoData.tasks)
  .flat()
  .map(taskResult => taskResult.task.slug);
