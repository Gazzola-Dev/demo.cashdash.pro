const { faker } = require("@faker-js/faker");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const USERS_TO_CREATE = 5;
const PROJECTS_PER_USER = 2;
const TASKS_PER_PROJECT = 5;
const SUBTASKS_PER_TASK = 3;
const COMMENTS_PER_TASK = 2;
const TAGS_TO_CREATE = 8;

async function seed() {
  console.log("Starting seed process...");

  // Create tags first as they'll be used across tasks
  const tags = await createTags();
  console.log(`Created ${tags.length} tags`);

  // Create users and their profiles
  const users = [];
  for (let i = 0; i < USERS_TO_CREATE; i++) {
    const user = await createUser();
    if (user) users.push(user);
  }
  console.log(`Created ${users.length} users`);

  // Create projects and related data for each user
  for (const user of users) {
    const projects = await createProjectsForUser(user, tags);
    console.log(`Created ${projects.length} projects for user ${user.email}`);
  }

  console.log("Seed completed successfully!");
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

async function createUser() {
  const email = faker.internet.email();
  const password = faker.internet.password();

  // Create auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
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
      display_name: faker.person.fullName(),
      professional_title: faker.person.jobTitle(),
      bio: faker.lorem.paragraph(),
      github_username: faker.internet.username(),
      website: faker.internet.url(),
      avatar_url: faker.image.avatar(),
    })
    .eq("id", authData.user.id)
    .select()
    .single();

  if (profileError) {
    console.error("Error updating profile:", profileError);
    return null;
  }

  return { ...authData.user, profile };
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
      github_owner: faker.internet.username(),
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
    await supabase.from("project_members").insert({
      project_id: createdProject.id,
      user_id: user.id,
      role: "owner",
    });

    // Create tasks for project
    const tasks = await createTasksForProject(createdProject, user, tags);

    projects.push({ ...createdProject, tasks });
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

// Run the seed function
seed()
  .catch(console.error)
  .finally(() => process.exit());
