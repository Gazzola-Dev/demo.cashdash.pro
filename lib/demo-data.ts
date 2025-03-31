/**
 * Demo Data for CashDash.Pro Walkthrough
 * This file contains the demo walkthrough steps that guide users through the main features of the app.
 */

export type DemoStepType = "dialog" | "indicator" | "highlight";

export interface DemoStep {
  id: string;
  type: DemoStepType;
  title: string;
  content: string;
  targetId?: string;
  position?: "top" | "bottom" | "left" | "right";
  highlightOptions?: {
    padding?: number;
    borderRadius?: number;
    backdropColor?: string;
  };
  nextButtonText?: string;
  skipButtonText?: string;
  showSkipButton?: boolean;
  showProgressBar?: boolean;
  disableOverlayClose?: boolean;
  disableKeyboardNav?: boolean;
  onBeforeShow?: () => void;
  onAfterShow?: () => void;
  onBeforeHide?: () => void;
  onAfterHide?: () => void;
}

export interface DemoData {
  id: string;
  name: string;
  description: string;
  steps: DemoStep[];
}

const demoData: DemoData = {
  id: "cashdash-main-walkthrough",
  name: "CashDash.Pro Walkthrough",
  description: "Learn how to use the main features of CashDash.Pro",
  steps: [
    // Welcome and introduction
    {
      id: "welcome",
      type: "dialog",
      title: "Welcome to CashDash.Pro!",
      content:
        'This quick tour will show you how to use the main features of CashDash.Pro. Click "Next" to begin.',
      nextButtonText: "Let's Go",
      showSkipButton: true,
      skipButtonText: "Skip Tour",
      showProgressBar: true,
      disableOverlayClose: true,
    },

    // Navigation introduction
    {
      id: "sidebar-intro",
      type: "indicator",
      title: "Navigation",
      content:
        "The sidebar provides quick access to your dashboard, milestones, tasks, and project settings.",
      targetId: "sidebar-root",
      position: "right",
      highlightOptions: {
        padding: 10,
        borderRadius: 8,
      },
    },

    // Project Switcher
    {
      id: "project-switcher",
      type: "indicator",
      title: "Project Switcher",
      content:
        "Click here to switch between your projects or create a new one.",
      targetId: "project-switcher",
      position: "right",
      highlightOptions: {
        padding: 5,
        borderRadius: 8,
      },
    },

    // Project Card
    {
      id: "project-card",
      type: "indicator",
      title: "Project Details",
      content:
        'View and edit your project details here. Click "Project Details" to expand the card.',
      targetId: "project-card",
      position: "bottom",
      highlightOptions: {
        padding: 10,
        borderRadius: 8,
      },
    },

    // Project editing
    {
      id: "project-editing",
      type: "indicator",
      title: "Edit Project Information",
      content:
        "Click on any field to edit your project name, description, or other details.",
      targetId: "project-name-field",
      position: "bottom",
      highlightOptions: {
        padding: 5,
        borderRadius: 4,
      },
    },

    // Project Members
    {
      id: "members-card",
      type: "indicator",
      title: "Team Members",
      content:
        "Manage your project team here. You can invite new members, assign project manager roles, or remove members.",
      targetId: "members-card",
      position: "top",
      highlightOptions: {
        padding: 10,
        borderRadius: 8,
      },
    },

    // Invite members
    {
      id: "invite-members",
      type: "indicator",
      title: "Invite Team Members",
      content: "Click here to invite new team members to your project.",
      targetId: "invite-members-button",
      position: "left",
      highlightOptions: {
        padding: 5,
        borderRadius: 4,
      },
    },

    // Project Manager toggle
    {
      id: "pm-toggle",
      type: "indicator",
      title: "Project Manager Role",
      content:
        "Toggle this switch to grant or revoke project manager privileges. Project managers can edit project details, manage milestones, and process payments.",
      targetId: "pm-toggle-switch",
      position: "left",
      highlightOptions: {
        padding: 5,
        borderRadius: 4,
      },
    },

    // Milestone Card
    {
      id: "milestone-card",
      type: "indicator",
      title: "Milestones",
      content:
        "Track project progress with milestones. Each milestone can have tasks, deadlines, and associated contracts.",
      targetId: "milestone-card",
      position: "bottom",
      highlightOptions: {
        padding: 10,
        borderRadius: 8,
      },
    },

    // Milestone selector
    {
      id: "milestone-selector",
      type: "indicator",
      title: "Select Milestone",
      content:
        "Use this dropdown to switch between different milestones in your project.",
      targetId: "milestone-selector",
      position: "bottom",
      highlightOptions: {
        padding: 5,
        borderRadius: 4,
      },
    },

    // Milestone status
    {
      id: "milestone-status",
      type: "indicator",
      title: "Milestone Status",
      content:
        "Change the status of your milestone to track its progress from draft to completion.",
      targetId: "milestone-status-field",
      position: "right",
      highlightOptions: {
        padding: 5,
        borderRadius: 4,
      },
    },

    // Contract Card
    {
      id: "contract-card",
      type: "indicator",
      title: "Contracts",
      content:
        "Manage client contracts associated with your milestones. Track payments, approvals, and contract members.",
      targetId: "contract-card",
      position: "top",
      highlightOptions: {
        padding: 10,
        borderRadius: 8,
      },
    },

    // Contract Details
    {
      id: "contract-details",
      type: "indicator",
      title: "Contract Details",
      content:
        "Edit contract information including title, client name, amount, and start date.",
      targetId: "contract-details-section",
      position: "bottom",
      highlightOptions: {
        padding: 5,
        borderRadius: 4,
      },
    },

    // Contract Tasks
    {
      id: "contract-tasks",
      type: "indicator",
      title: "Contract Tasks",
      content:
        "Associate specific tasks with your contract to track deliverables.",
      targetId: "contract-tasks-section",
      position: "top",
      highlightOptions: {
        padding: 5,
        borderRadius: 4,
      },
    },

    // Contract Members
    {
      id: "contract-members",
      type: "indicator",
      title: "Contract Members",
      content:
        "Assign team members to the contract and track their approval status.",
      targetId: "contract-members-card",
      position: "left",
      highlightOptions: {
        padding: 10,
        borderRadius: 8,
      },
    },

    // Contract approval
    {
      id: "contract-approval",
      type: "indicator",
      title: "Contract Approval",
      content:
        "Team members can approve contracts by toggling this switch. All assigned members must approve before payment can be processed.",
      targetId: "approval-switch",
      position: "left",
      highlightOptions: {
        padding: 5,
        borderRadius: 4,
      },
    },

    // Payment Processing
    {
      id: "contract-payment",
      type: "indicator",
      title: "Payment Processing",
      content:
        "Once all members approve the contract, project managers can process payment here.",
      targetId: "payment-button",
      position: "bottom",
      highlightOptions: {
        padding: 5,
        borderRadius: 4,
      },
    },

    // Task Management
    {
      id: "task-list",
      type: "indicator",
      title: "Task Management",
      content:
        "View and manage all tasks associated with your project. Tasks can be assigned to team members and linked to milestones.",
      targetId: "task-list",
      position: "right",
      highlightOptions: {
        padding: 10,
        borderRadius: 8,
      },
    },

    // Task Status
    {
      id: "task-status",
      type: "indicator",
      title: "Task Status",
      content:
        'Update task status to track progress from "To Do" through "In Progress" to "Complete".',
      targetId: "task-status-icon",
      position: "left",
      highlightOptions: {
        padding: 5,
        borderRadius: 4,
      },
    },

    // Theme Switcher
    {
      id: "theme-switcher",
      type: "indicator",
      title: "Theme Preferences",
      content: "Toggle between light and dark mode with the theme switcher.",
      targetId: "theme-switcher",
      position: "right",
      highlightOptions: {
        padding: 5,
        borderRadius: 4,
      },
    },

    // Profile Settings
    {
      id: "profile-settings",
      type: "indicator",
      title: "Your Profile",
      content: "Access your profile settings and account preferences here.",
      targetId: "profile-form",
      position: "top",
      highlightOptions: {
        padding: 5,
        borderRadius: 4,
      },
    },

    // Wrap-up dialog
    {
      id: "tour-complete",
      type: "dialog",
      title: "Tour Complete! 🎉",
      content:
        "Congratulations! You now know the basics of CashDash.Pro. Start managing your projects, milestones, and contracts with ease. Need help? Click the help icon in the top right corner at any time.",
      nextButtonText: "Get Started",
      showSkipButton: false,
      showProgressBar: false,
      disableOverlayClose: true,
    },
  ],
};

export default demoData;

/**
 * Example usage in your application:
 *
 * import demoData from '@/data/demo-data';
 *
 * // In your component:
 * const startDemo = () => {
 *   const demoEngine = new DemoEngine(demoData);
 *   demoEngine.start();
 * };
 */
