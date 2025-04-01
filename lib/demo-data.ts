/**
 * Demo Data for Project Management Walkthrough
 * This file contains the demo walkthrough steps that guide users through the main features of the app.
 */

// Element IDs for targeting in the demo
export enum DemoElementId {
  // Invitation Modal
  INVITATION_ACCEPT_BUTTON = "invitation-accept-button",

  // Project Card
  PROJECT_CARD_EXPAND = "project-card-expand",
  PROJECT_NAME_FIELD = "project-name-field",
  PROJECT_DESCRIPTION_FIELD = "project-description-field",
  PROJECT_PREFIX_FIELD = "project-prefix-field",
  PROJECT_GITHUB_URL_FIELD = "project-github-repo-url-field",

  // Milestone Card
  MILESTONE_CARD_EXPAND = "milestone-card-expand",
  MILESTONE_TITLE_FIELD = "milestone-title-field",
  MILESTONE_STATUS_FIELD = "milestone-status-field",
  MILESTONE_DESCRIPTION_FIELD = "milestone-description-field",
  MILESTONE_DUE_DATE_FIELD = "milestone-dueDate-field",
  MILESTONE_NAV_BUTTON = "milestone-nav-button",
  MILESTONE_SELECT = "milestone-select-element",

  // Task List
  TASK_DRAG_HANDLE = "task-drag-handle",
  TASK_STATUS_SELECT = "task-status-select",
  TASK_ASSIGNEE_SELECT = "task-assignee-select",
  TASK_LIST_HEADER_BUTTONS = "task-list-header-buttons",
  TASK_LIST_ITEMS = "task-list-items",

  // Task Components
  TASK_SIDEBAR = "task-sidebar",
  TASK_HEADER = "task-header",
  TASK_DESCRIPTION = "task-description",

  // Project Members Card
  MEMBERS_CARD_EXPAND = "members-card-expand",
  MEMBER_CARDS = "member-cards",
  INVITATION_CARDS = "invitation-cards",

  // Contract Cards
  CONTRACT_DETAILS_EXPAND = "contract-details-expand",
  CONTRACT_TASKS_EXPAND = "contract-tasks-expand",
  CONTRACT_MEMBERS_EXPAND = "contract-members-expand",
  CONTRACT_PAYMENT_EXPAND = "contract-payment-expand",
}

export interface DemoStep {
  id: string;
  title: string;
  content: string;
  targetIds?: DemoElementId[];
  waitForInteraction?: boolean;
  nextButtonText?: string;
  skipButtonText?: string;
  showSkipButton?: boolean;
  showProgressBar?: boolean;
  disableOverlayClose?: boolean;
  disableKeyboardNav?: boolean;
  type: "dialog" | "popover";
}

const demoData: DemoStep[] = [
  // Welcome step
  {
    id: "welcome",
    title: "Welcome to Project Management",
    content:
      "Let's walk through the main features of our project management tool to help you get started.",
    nextButtonText: "Let's Go",
    showSkipButton: true,
    skipButtonText: "Skip Tour",
    showProgressBar: true,
    disableOverlayClose: true,
    type: "dialog",
  },

  // Invitation step
  {
    id: "invitation-accept",
    title: "Accept Invitation",
    content: "Start by accepting the project invitation to join the team.",
    targetIds: [DemoElementId.INVITATION_ACCEPT_BUTTON],
    waitForInteraction: true,
    type: "popover",
  },

  // Project Card expand button
  {
    id: "project-card-expand",
    title: "Project Details",
    content:
      "Click this button to expand the project card and view all details.",
    targetIds: [DemoElementId.PROJECT_CARD_EXPAND],
    waitForInteraction: true,
    type: "popover",
  },

  // Project Card fields
  {
    id: "project-card-fields",
    title: "Edit Project Information",
    content:
      "You can edit any of these fields to update your project details. Click on any field to continue.",
    targetIds: [
      DemoElementId.PROJECT_NAME_FIELD,
      DemoElementId.PROJECT_DESCRIPTION_FIELD,
      DemoElementId.PROJECT_PREFIX_FIELD,
      DemoElementId.PROJECT_GITHUB_URL_FIELD,
    ],
    waitForInteraction: true,
    type: "popover",
  },

  // Members Card expand button
  {
    id: "members-card-expand",
    title: "Team Members",
    content:
      "Click this button to expand the members card and view the project team.",
    targetIds: [DemoElementId.MEMBERS_CARD_EXPAND],
    waitForInteraction: true,
    type: "popover",
  },

  // Member Cards
  {
    id: "member-cards",
    title: "Project Team",
    content:
      "Here you can see all team members and their roles. Project Managers can add, remove, or change member roles.",
    targetIds: [DemoElementId.MEMBER_CARDS],
    waitForInteraction: true,
    type: "popover",
  },

  // Invitation Cards
  {
    id: "invitation-cards",
    title: "Pending Invitations",
    content:
      "Any pending invitations will appear here. You can cancel invitations that haven't been accepted yet.",
    targetIds: [DemoElementId.INVITATION_CARDS],
    waitForInteraction: false,
    type: "popover",
  },

  // Milestone Card expand button
  {
    id: "milestone-card-expand",
    title: "Milestone Details",
    content:
      "Click this button to expand the milestone card and view all milestone details.",
    targetIds: [DemoElementId.MILESTONE_CARD_EXPAND],
    waitForInteraction: true,
    type: "popover",
  },

  // Milestone Card fields
  {
    id: "milestone-card-fields",
    title: "Edit Milestone Information",
    content:
      "You can edit any of these fields to update your milestone details. Click on any field to continue.",
    targetIds: [
      DemoElementId.MILESTONE_TITLE_FIELD,
      DemoElementId.MILESTONE_STATUS_FIELD,
      DemoElementId.MILESTONE_DESCRIPTION_FIELD,
      DemoElementId.MILESTONE_DUE_DATE_FIELD,
    ],
    waitForInteraction: true,
    type: "popover",
  },

  // Milestone Nav Button
  {
    id: "milestone-nav-button",
    title: "Milestone Navigation",
    content:
      "Click this button in the sidebar to quickly navigate to the current milestone.",
    targetIds: [DemoElementId.MILESTONE_NAV_BUTTON],
    waitForInteraction: true,
    type: "popover",
  },

  // Milestone Select Element
  {
    id: "milestone-select",
    title: "Switch Milestones",
    content:
      "Use this dropdown to switch between different milestones in your project. Try changing the selected milestone now.",
    targetIds: [DemoElementId.MILESTONE_SELECT],
    waitForInteraction: true,
    type: "popover",
  },

  // Task List Header Buttons
  {
    id: "task-list-header-buttons",
    title: "Task List Controls",
    content:
      "These buttons allow you to sort, filter, and organize your tasks by priority, status, creation date, and assignee.",
    targetIds: [DemoElementId.TASK_LIST_HEADER_BUTTONS],
    waitForInteraction: true,
    type: "popover",
  },

  // Task List Items
  {
    id: "task-list-items",
    title: "Task List",
    content:
      "Your tasks appear here. You can click on any task to view and edit its details. Tasks are color-coded by status.",
    targetIds: [DemoElementId.TASK_LIST_ITEMS],
    waitForInteraction: true,
    type: "popover",
  },

  // Task Components
  {
    id: "task-components",
    title: "Task Management",
    content:
      "The task view has several components: header to edit the title, description area for details, and a sidebar with controls for status, assignee, and priority.",
    targetIds: [
      DemoElementId.TASK_HEADER,
      DemoElementId.TASK_DESCRIPTION,
      DemoElementId.TASK_SIDEBAR,
    ],
    waitForInteraction: true,
    type: "popover",
  },

  // Task List drag handles
  {
    id: "task-drag-handles",
    title: "Task Reordering",
    content:
      "Drag any task to reorder your task list. Drag and drop a task to continue.",
    targetIds: [DemoElementId.TASK_DRAG_HANDLE],
    waitForInteraction: true,
    type: "popover",
  },

  // Task List select elements
  {
    id: "task-select-elements",
    title: "Task Management",
    content:
      "Change the status or assignee of any task to update its progress. Change any of these values to continue.",
    targetIds: [
      DemoElementId.TASK_STATUS_SELECT,
      DemoElementId.TASK_ASSIGNEE_SELECT,
    ],
    waitForInteraction: true,
    type: "popover",
  },

  // Contract Details Expand
  {
    id: "contract-details-expand",
    title: "Contract Details",
    content:
      "Click this button to expand the contract details card and view information about the client and project scope.",
    targetIds: [DemoElementId.CONTRACT_DETAILS_EXPAND],
    waitForInteraction: true,
    type: "popover",
  },

  // Contract Tasks Expand
  {
    id: "contract-tasks-expand",
    title: "Contract Tasks",
    content:
      "Click this button to expand the contract tasks card and view deliverables associated with this contract.",
    targetIds: [DemoElementId.CONTRACT_TASKS_EXPAND],
    waitForInteraction: true,
    type: "popover",
  },

  // Contract Members Expand
  {
    id: "contract-members-expand",
    title: "Contract Members",
    content:
      "Click this button to expand the contract members card and view team members working on this contract.",
    targetIds: [DemoElementId.CONTRACT_MEMBERS_EXPAND],
    waitForInteraction: true,
    type: "popover",
  },

  // Contract Payment Expand
  {
    id: "contract-payment-expand",
    title: "Contract Payment",
    content:
      "Click this button to expand the payment information card and manage billing for this contract.",
    targetIds: [DemoElementId.CONTRACT_PAYMENT_EXPAND],
    waitForInteraction: true,
    type: "popover",
  },

  // Complete step
  {
    id: "tour-complete",
    title: "Tour Complete! 🎉",
    content:
      "Congratulations! You now know the basics of our project management tool. Start managing your projects, milestones, and tasks with ease.",
    nextButtonText: "Get Started",
    showSkipButton: false,
    showProgressBar: false,
    disableOverlayClose: true,
    type: "dialog",
  },
];

export default demoData;
