import {
  acceptProjectInvite,
  addComment,
  cleanupExistingProjects,
  createProject,
  createTask,
  declineProjectInvite,
  inviteUser,
  signIn,
  testData,
  updateComment,
  updateTask,
  verifyLimitedPermissions,
  verifyNoProjectAccess,
} from "@/cypress/e2e/test.util.cy";

// TODO: add additional project with admin, check if it shows only on certain lists

// Environment Variables
const email1 = Cypress.env("TEST_EMAIL_1");
const email2 = Cypress.env("TEST_EMAIL_2");
const email3 = Cypress.env("TEST_EMAIL_3");
const password = Cypress.env("DEV_PASSWORD");

describe("Full Application Flow Test", () => {
  it("Should complete the full application flow", () => {
    // + Project
    signIn(email1, password);
    cy.url().should("include", "/projects");

    cleanupExistingProjects();
    createProject(testData.project.name.initial);
    // add update project, look for updated slug later in test

    // + Task + Comment
    createTask({
      title: testData.task.title.initial,
      description: testData.task.description.initial,
      slug: testData.task.slug,
    });
    addComment(testData.task.comments.user1.initial);
    updateTask({
      title: testData.task.title.updated,
      description: testData.task.description.updated,
    });
    updateComment(testData.task.comments.user1.updated);

    // + User invitations
    inviteUser(email2);
    inviteUser(email3);

    // + Accept user 2 invitation
    cy.get('[data-test="sign-out"]').click();
    signIn(email2, password);

    acceptProjectInvite(testData.project.slug.initial);
    verifyLimitedPermissions();

    addComment(testData.task.comments.user2.initial);
    updateComment(testData.task.comments.user2.updated);

    // + Decline user 3 invitation
    cy.get('[data-test="sign-out"]').click();
    signIn(email3, password);

    declineProjectInvite(testData.project.slug.initial);
    verifyNoProjectAccess(testData.project.slug.initial);
  });
});
