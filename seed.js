const { faker } = require("@faker-js/faker");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const USERS_TO_CREATE = process.env.DEV_EMAIL ? 0 : 5;
const PROJECTS_PER_USER = 2;
const TASKS_PER_PROJECT = 5;
const SUBTASKS_PER_TASK = 3;
const COMMENTS_PER_TASK = 2;
const TAGS_TO_CREATE = 8;

async function getOrCreateUser(email) {
  if (!email) {
    console.error("No email provided");
    return null;
  }

  // First check if user exists
  const {
    data: { users },
    error: usersError,
  } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error("Error checking existing users:", usersError);
    return null;
  }

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    console.log(`Found existing user: ${email} with ID ${existingUser.id}`);

    // Update the profile if it exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: "Development User",
        professional_title: "Software Developer",
        bio: "Development account for testing.",
        github_username: "dev-user",
        website: "https://example.com",
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      })
      .eq("id", existingUser.id)
      .select()
      .single();

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    return { ...existingUser, profile };
  }

  // If user doesn't exist, create new one
  const password = "password123";
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: email,
      password,
      email_confirm: true,
    });

  if (authError) {
    console.error("Error creating user:", authError);
    return null;
  }

  // Profile is created automatically via trigger
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: "Development User",
      professional_title: "Software Developer",
      bio: "Development account for testing.",
      github_username: "dev-user",
      website: "https://example.com",
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    })
    .eq("id", authData.user.id)
    .select()
    .single();

  if (profileError) {
    console.error("Error updating profile:", profileError);
    return null;
  }

  console.log(`Created new user: ${email} with ID ${authData.user.id}`);
  return { ...authData.user, profile };
}

async function clearExistingData(userId) {
  console.log(`Clearing existing data for user ${userId}...`);

  // Get all project IDs for the user
  const { data: memberships } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", userId);

  if (memberships?.length > 0) {
    const projectIds = memberships.map(m => m.project_id);

    // Delete all projects (this will cascade to tasks, comments, etc.)
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .in("id", projectIds);

    if (deleteError) {
      console.error("Error deleting projects:", deleteError);
    }
  }

  // Reset current_project_id in profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ current_project_id: null })
    .eq("id", userId);

  if (profileError) {
    console.error("Error resetting profile:", profileError);
  }

  console.log("Finished clearing existing data");
}

async function createTags() {
  const tags = [];
  const colors = [
    "red",
    "green",
    "blue",
    "yellow",
    "purple",
    "orange",
    "pink",
    "cyan",
  ];

  for (let i = 0; i < TAGS_TO_CREATE; i++) {
    const tag = {
      name: faker.word.noun(),
      color: colors[i % colors.length],
    };

    const { data: createdTag, error } = await supabase
      .from("tags")
      .insert(tag)
      .select()
      .single();

    if (!error) tags.push(createdTag);
  }

  return tags;
}

async function createProjectsForUser(user, tags) {
  const projects = [];

  for (let i = 0; i < PROJECTS_PER_USER; i++) {
    // Create project
    const projectName = faker.company.name() + " " + faker.company.buzzPhrase();
    const projectSlug = faker.helpers.slugify(projectName).toLowerCase();

    const project = {
      name: projectName,
      description: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: faker.lorem.paragraph() }],
          },
        ],
      },
      status: faker.helpers.arrayElement(["active", "archived", "completed"]),
      slug: projectSlug,
      prefix: projectSlug.substring(0, 3).toUpperCase(),
      github_repo_url: faker.internet.url(),
      github_owner: faker.internet.userName(),
      github_repo: projectSlug,
    };

    const { data: createdProject, error: projectError } = await supabase
      .from("projects")
      .insert(project)
      .select()
      .single();

    if (projectError) {
      console.error("Error creating project:", projectError);
      continue;
    }

    // Add user as project owner
    const { error: memberError } = await supabase
      .from("project_members")
      .insert({
        project_id: createdProject.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      console.error("Error creating project membership:", memberError);
      continue;
    }

    // Set as current project if it's the first one
    if (i === 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ current_project_id: createdProject.id })
        .eq("id", user.id);

      if (profileError) {
        console.error("Error updating current project:", profileError);
      }
    }

    // Create tasks for project
    const tasks = await createTasksForProject(createdProject, user, tags);

    projects.push({ ...createdProject, tasks });
    console.log(
      `Created project ${createdProject.name} with ID ${createdProject.id}`,
    );
  }

  return projects;
}

async function createTasksForProject(project, user, tags) {
  const tasks = [];

  for (let i = 0; i < TASKS_PER_PROJECT; i++) {
    const taskTitle = faker.company.buzzPhrase();
    const taskSlug = faker.helpers.slugify(taskTitle).toLowerCase();

    const task = {
      project_id: project.id,
      title: taskTitle,
      description: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: faker.lorem.paragraph() }],
          },
        ],
      },
      status: faker.helpers.arrayElement([
        "backlog",
        "todo",
        "in_progress",
        "in_review",
        "completed",
      ]),
      priority: faker.helpers.arrayElement(["low", "medium", "high", "urgent"]),
      slug: taskSlug,
      prefix: project.prefix,
      assignee: user.id,
      budget_cents: faker.number.int({ min: 10000, max: 1000000 }),
    };

    const { data: createdTask, error: taskError } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .single();

    if (taskError) {
      console.error("Error creating task:", taskError);
      continue;
    }

    // Add random tags to task
    const taskTags = faker.helpers.arrayElements(
      tags,
      faker.number.int({ min: 1, max: 3 }),
    );
    for (const tag of taskTags) {
      await supabase.from("task_tags").insert({
        task_id: createdTask.id,
        tag_id: tag.id,
      });
    }

    // Create subtasks
    await createSubtasksForTask(createdTask);

    // Create task schedule
    await createTaskSchedule(createdTask);

    // Create comments
    await createCommentsForTask(createdTask, user);

    tasks.push(createdTask);
  }

  return tasks;
}

async function createSubtasksForTask(task) {
  for (let i = 0; i < SUBTASKS_PER_TASK; i++) {
    const subtask = {
      task_id: task.id,
      title: faker.company.buzzPhrase(),
      description: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: faker.lorem.paragraph() }],
          },
        ],
      },
      status: faker.helpers.arrayElement([
        "backlog",
        "todo",
        "in_progress",
        "in_review",
        "completed",
      ]),
      budget_cents: faker.number.int({ min: 5000, max: 100000 }),
    };

    await supabase.from("subtasks").insert(subtask);
  }
}

async function createTaskSchedule(task) {
  const startDate = faker.date.future();
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + faker.number.int({ min: 7, max: 30 }));

  const schedule = {
    task_id: task.id,
    start_date: startDate.toISOString(),
    due_date: dueDate.toISOString(),
    estimated_hours: faker.number.float({ min: 10, max: 100, precision: 0.5 }),
    actual_hours:
      task.status === "completed"
        ? faker.number.float({ min: 10, max: 100, precision: 0.5 })
        : null,
    completed_at: task.status === "completed" ? faker.date.recent() : null,
  };

  await supabase.from("task_schedule").insert(schedule);
}

async function createCommentsForTask(task, user) {
  for (let i = 0; i < COMMENTS_PER_TASK; i++) {
    const comment = {
      content_type: "task",
      content_id: task.id,
      user_id: user.id,
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: faker.lorem.paragraph() }],
          },
        ],
      },
      is_edited: faker.datatype.boolean(),
    };

    await supabase.from("comments").insert(comment);
  }
}

async function seed() {
  console.log("Starting seed process...");

  // Get or create user
  const user = await getOrCreateUser(process.env.DEV_EMAIL);
  if (!user) {
    console.error("Failed to get or create user");
    return;
  }

  // Clear existing data for this user
  await clearExistingData(user.id);

  // Create tags first as they'll be used across tasks
  const tags = await createTags();
  console.log(`Created ${tags.length} tags`);

  // Create projects and related data
  const projects = await createProjectsForUser(user, tags);
  console.log(`Created ${projects.length} projects for user ${user.email}`);

  // Verify setup
  const { data: memberships, error: membershipError } = await supabase
    .from("project_members")
    .select("*")
    .eq("user_id", user.id);

  if (membershipError) {
    console.error("Error verifying memberships:", membershipError);
  } else {
    console.log(`Verified ${memberships.length} project memberships for user`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error verifying profile:", profileError);
  } else {
    console.log(
      `Verified profile current_project_id: ${profile.current_project_id}`,
    );
  }

  console.log("Seed completed successfully!");
}

// Run the seed function
seed()
  .catch(console.error)
  .finally(() => process.exit());
