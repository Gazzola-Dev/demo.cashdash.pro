/**
 * Contextual Demo Data for Project Management
 * This file contains the demo information that will be displayed when elements with
 * corresponding IDs are detected in the DOM.
 */

// Element IDs for targeting in the demo - kept the same as original for compatibility
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

// Group related elements by feature area for better organization
export enum DemoCategory {
  PROJECT = "Project Management",
  MILESTONE = "Milestone Management",
  TASK = "Task Management",
  TEAM = "Team Management",
  CONTRACT = "Contract Management",
}

export interface DemoStep {
  id: string;
  title: string;
  content: string;
  targetIds?: DemoElementId[];
  category: DemoCategory;
  priority?: number; // Higher values show first in the list
}

const contextualDemoData: DemoStep[] = [
  // Project Management Items
  {
    id: "project-card-expand",
    title: "Project Details Expand",
    content:
      "Click this button to expand the project card and view or edit all project details.",
    targetIds: [DemoElementId.PROJECT_CARD_EXPAND],
    category: DemoCategory.PROJECT,
    priority: 10,
  },
  {
    id: "project-editing",
    title: "Edit Project Information",
    content:
      "These fields allow you to update your project details. Click on any field to edit it directly.",
    targetIds: [
      DemoElementId.PROJECT_NAME_FIELD,
      DemoElementId.PROJECT_DESCRIPTION_FIELD,
      DemoElementId.PROJECT_PREFIX_FIELD,
      DemoElementId.PROJECT_GITHUB_URL_FIELD,
    ],
    category: DemoCategory.PROJECT,
    priority: 9,
  },

  // Milestone Management Items
  {
    id: "milestone-card-expand",
    title: "Milestone Details Expand",
    content:
      "Click this button to expand the milestone card and access all milestone information.",
    targetIds: [DemoElementId.MILESTONE_CARD_EXPAND],
    category: DemoCategory.MILESTONE,
    priority: 10,
  },
  {
    id: "milestone-editing",
    title: "Edit Milestone Information",
    content:
      "You can update milestone details by clicking on these fields. Changes are saved automatically.",
    targetIds: [
      DemoElementId.MILESTONE_TITLE_FIELD,
      DemoElementId.MILESTONE_STATUS_FIELD,
      DemoElementId.MILESTONE_DESCRIPTION_FIELD,
      DemoElementId.MILESTONE_DUE_DATE_FIELD,
    ],
    category: DemoCategory.MILESTONE,
    priority: 9,
  },
  {
    id: "milestone-navigation",
    title: "Milestone Navigation",
    content:
      "Use these controls to navigate between milestones in your project.",
    targetIds: [
      DemoElementId.MILESTONE_NAV_BUTTON,
      DemoElementId.MILESTONE_SELECT,
    ],
    category: DemoCategory.MILESTONE,
    priority: 8,
  },

  // Task Management Items
  {
    id: "task-list-controls",
    title: "Task List Controls",
    content:
      "These buttons let you sort, filter, and organize your tasks by different criteria.",
    targetIds: [DemoElementId.TASK_LIST_HEADER_BUTTONS],
    category: DemoCategory.TASK,
    priority: 10,
  },
  {
    id: "task-items",
    title: "Task List Items",
    content:
      "Your tasks appear here. They're color-coded by status for easy identification.",
    targetIds: [DemoElementId.TASK_LIST_ITEMS],
    category: DemoCategory.TASK,
    priority: 9,
  },
  {
    id: "task-details",
    title: "Task Details",
    content:
      "View and edit task details in this area. The header shows the title, description area for details, and sidebar for status and assignments.",
    targetIds: [
      DemoElementId.TASK_HEADER,
      DemoElementId.TASK_DESCRIPTION,
      DemoElementId.TASK_SIDEBAR,
    ],
    category: DemoCategory.TASK,
    priority: 8,
  },
  {
    id: "task-reordering",
    title: "Task Reordering",
    content:
      "Use these handles to drag and drop tasks to change their order in the list.",
    targetIds: [DemoElementId.TASK_DRAG_HANDLE],
    category: DemoCategory.TASK,
    priority: 7,
  },
  {
    id: "task-quick-edit",
    title: "Quick Task Management",
    content:
      "Use these dropdowns to quickly change task status or assignee without opening the full task details.",
    targetIds: [
      DemoElementId.TASK_STATUS_SELECT,
      DemoElementId.TASK_ASSIGNEE_SELECT,
    ],
    category: DemoCategory.TASK,
    priority: 6,
  },

  // Team Management Items
  {
    id: "invitation-accept",
    title: "Accept Project Invitation",
    content:
      "Click this button to accept the invitation and join the project team.",
    targetIds: [DemoElementId.INVITATION_ACCEPT_BUTTON],
    category: DemoCategory.TEAM,
    priority: 10,
  },
  {
    id: "members-card-expand",
    title: "Team Members Expand",
    content: "Click to view all project team members and their roles.",
    targetIds: [DemoElementId.MEMBERS_CARD_EXPAND],
    category: DemoCategory.TEAM,
    priority: 9,
  },
  {
    id: "member-cards",
    title: "Project Team",
    content:
      "This area shows all current team members and their project roles. Project Managers can add or remove members.",
    targetIds: [DemoElementId.MEMBER_CARDS],
    category: DemoCategory.TEAM,
    priority: 8,
  },
  {
    id: "invitation-cards",
    title: "Pending Invitations",
    content:
      "View and manage pending team invitations in this section. You can resend or cancel invitations as needed.",
    targetIds: [DemoElementId.INVITATION_CARDS],
    category: DemoCategory.TEAM,
    priority: 7,
  },

  // Contract Management Items
  {
    id: "contract-details-expand",
    title: "Contract Details",
    content:
      "Expand this section to view information about the client and project scope.",
    targetIds: [DemoElementId.CONTRACT_DETAILS_EXPAND],
    category: DemoCategory.CONTRACT,
    priority: 10,
  },
  {
    id: "contract-tasks-expand",
    title: "Contract Tasks",
    content:
      "View all deliverables associated with this contract by expanding this section.",
    targetIds: [DemoElementId.CONTRACT_TASKS_EXPAND],
    category: DemoCategory.CONTRACT,
    priority: 9,
  },
  {
    id: "contract-members-expand",
    title: "Contract Team",
    content:
      "See which team members are assigned to this contract by expanding this section.",
    targetIds: [DemoElementId.CONTRACT_MEMBERS_EXPAND],
    category: DemoCategory.CONTRACT,
    priority: 8,
  },
  {
    id: "contract-payment-expand",
    title: "Payment Information",
    content:
      "Manage billing and payment details for this contract in this section.",
    targetIds: [DemoElementId.CONTRACT_PAYMENT_EXPAND],
    category: DemoCategory.CONTRACT,
    priority: 7,
  },
];

// Helper function to get demo items by category
export const getDemoItemsByCategory = (category: DemoCategory): DemoStep[] => {
  return contextualDemoData
    .filter(item => item.category === category)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
};

// Helper function to get demo item by ID
export const getDemoItemById = (id: string): DemoStep | undefined => {
  return contextualDemoData.find(item => item.id === id);
};

// Helper function to get demo items by element ID
export const getDemoItemsByElementId = (
  elementId: DemoElementId,
): DemoStep[] => {
  return contextualDemoData
    .filter(item => item.targetIds?.includes(elementId))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
};

export default contextualDemoData;
