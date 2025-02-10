export const testData = {
  project: {
    name: {
      initial: "Test Project",
      updated: "Updated Test Project",
    },
    prefix: {
      initial: "TEST",
      updated: "TESTUPDATE",
    },
    description: {
      initial: "This is a test project description",
      updated: "This is an updated test project description",
    },
    slug: { initial: "test-project", updated: "updated-test-project" },
  },
  task: {
    slug: "test-task",
    title: {
      initial: "Test Task",
      updated: "Updated Test Task",
    },
    description: {
      initial: "This is a test task description",
      updated: "This is an updated test task description",
    },
    comments: {
      user1: {
        initial: "Test comment from user",
        updated: "Updated test comment from user",
      },
      user2: {
        initial: "Test comment from user 2",
        updated: "Updated test comment from user 2",
      },
      user3: {
        initial: "Test comment from user 3",
        updated: "Updated test comment from user 3",
      },
    },
  },
};

export const toggleProjectSwitcher = (callback?: () => void) => {
  cy.get('[data-test="project-switcher"]').then($switcher => {
    const isOpen = $switcher.hasClass("open");
    if (!isOpen) {
      cy.get('[data-test="project-switcher"]').click();
    }
    if (callback) {
      callback();
      if (!isOpen) {
        cy.get('[data-test="project-switcher"]').click();
      }
    }
  });
};

export const deleteProject = (projectName: string) => {
  cy.visit(`/${projectName}`);
  cy.get('[data-test="delete-project"]').click();
  cy.get('[data-test="confirm-delete"]').click();
  cy.get('[data-test="delete-modal"]').should("not.exist");
};

export const signIn = (email: string, password: string) => {
  cy.visit("/");
  cy.get('[data-test="email-input"]').type(email);
  cy.get('[data-test="password-input"]').type(password);
  cy.get('[data-test="submit-button"]').click();
};

export const cleanupExistingProjects = () => {
  toggleProjectSwitcher(() => {
    cy.get('[data-test="project-item"]').each($project => {
      const projectName = $project.find('[data-test="project-name"]').text();
      deleteProject(projectName);
    });
  });
};

export const createProject = (projectData: any) => {
  cy.visit("/projects/new");
  cy.get('[data-test="project-name"]').type(projectData.name);
  cy.get('[data-test="project-prefix"]').type(projectData.prefix);
  cy.get('[data-test="project-description"]').type(projectData.description);
  cy.get('[data-test="publish-project"]').click();
  cy.url().should("include", `/${projectData.slug}`);
  cy.contains(projectData.name).should("be.visible");
};

export const createTask = (taskData: any) => {
  cy.get('[data-test="new-task"]').click();
  cy.get('[data-test="task-title"]').type(taskData.title);
  cy.get('[data-test="task-description"]').type(taskData.description);
  cy.get('[data-test="publish-task"]').click();
  cy.url().should("include", `/${taskData.slug}`);
};

export const addComment = (comment: string) => {
  cy.get('[data-test="comment-input"]').type(comment);
  cy.get('[data-test="submit-comment"]').click();
  cy.contains(comment).should("be.visible");
};

export const updateTask = (taskData: any) => {
  cy.get('[data-test="edit-task"]').click();
  cy.get('[data-test="task-title"]').clear().type(taskData.title);
  cy.get('[data-test="task-description"]').clear().type(taskData.description);
  cy.get('[data-test="save-task"]').click();
};

export const updateComment = (comment: string) => {
  cy.get('[data-test="edit-comment"]').click();
  cy.get('[data-test="comment-input"]').clear().type(comment);
  cy.get('[data-test="save-comment"]').click();
};

export const inviteUser = (email: string) => {
  cy.get('[data-test="invite-member"]').click();
  cy.get('[data-test="invite-email"]').type(email);
  cy.get('[data-test="send-invite"]').click();
  cy.get('[data-test="toast-success"]').should("be.visible");
};

export const acceptProjectInvite = (projectSlug: string) => {
  toggleProjectSwitcher(() => {
    cy.get(`[data-test="project-${projectSlug}"]`).click();
  });
  cy.get('[data-test="accept-invite"]').click();
};

export const declineProjectInvite = (projectSlug: string) => {
  toggleProjectSwitcher(() => {
    cy.get(`[data-test="project-${projectSlug}"]`).click();
  });
  cy.get('[data-test="decline-invite"]').click();
  cy.url().should("eq", Cypress.config().baseUrl + "/");
};

export const verifyNoProjectAccess = (projectSlug: string) => {
  cy.visit(`/${projectSlug}`);
  cy.url().should("eq", Cypress.config().baseUrl + "/");
};

export const verifyLimitedPermissions = () => {
  cy.get('[data-test="edit-task"]').should("not.exist");
  cy.get('[data-test="edit-project"]').should("not.exist");
};
