// actions/members.actions.ts

"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import {
  ProjectInvitationWithDetails,
  ProjectMemberWithProfile,
} from "@/types/app.types";

interface UpdateProjectMemberParams {
  memberId: string;
  role: string;
}

interface ProjectMemberWithDetails {
  member: {
    id: string;
    project_id: string;
    user_id: string;
    role: string;
    created_at: string;
    updated_at?: string;
  };
  profile: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    email: string;
    professional_title: string | null;
    [key: string]: any;
  };
  project: {
    id: string;
    name: string;
    slug: string;
    [key: string]: any;
  };
}

// Add this function to send invitation emails
async function sendInvitationEmail(
  email: string,
  projectName: string,
  inviterId: string,
) {
  try {
    const resendApiKey = process.env.SMTP_API_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!resendApiKey) {
      throw new Error("SMTP_API_KEY not configured");
    }

    // Get inviter details
    const supabase = await getSupabaseServerActionClient();
    const { data: inviterData, error: inviterError } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("id", inviterId)
      .single();

    if (inviterError) throw inviterError;

    const inviterName = inviterData.display_name || inviterData.email;

    // Send email using Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Cash Dash Pro <no-reply@cashdash.pro>",
        to: email,
        subject: `Invitation to join ${projectName} on Cash Dash Pro`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You've been invited to join a project</h2>
            <p>${inviterName} has invited you to collaborate on <strong>${projectName}</strong> in Cash Dash Pro.</p>
            <p>Cash Dash Pro is a developer-focused task management platform that integrates GitHub activity with financial tracking.</p>
            <div style="margin: 30px 0;">
              <a href="${siteUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Invitation
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">This invitation was sent to ${email}. If you didn't expect this invitation, you can ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
    }

    conditionalLog("sendInvitationEmail", { success: true, email }, true);
    return true;
  } catch (error) {
    conditionalLog("sendInvitationEmail", { error }, true);
    return false;
  }
}

export const toggleProjectManagerRoleAction = async (
  projectId: string,
  userId: string,
  isManager: boolean,
): Promise<ActionResponse<ProjectMemberWithProfile>> => {
  const actionName = "toggleProjectManagerRoleAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // Determine the role to set based on isManager flag
    const role = isManager ? "admin" : "member";

    // Update the member's role
    const { data, error } = await supabase
      .from("project_members")
      .update({ role })
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .select(
        `
        *,
        profile:profiles(*)
      `,
      )
      .single();

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    return getActionResponse({ data: data as any as ProjectMemberWithProfile });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const inviteProjectMembersAction = async (
  projectId: string,
  emails: string[],
): Promise<ActionResponse<{ invited: number; errors: string[] }>> => {
  const actionName = "inviteProjectMembersAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    // Get project name using the database function instead of direct query
    const { data: projectName, error: projectError } = await supabase.rpc(
      "get_project_name_by_id",
      {
        p_project_id: projectId,
      },
    );

    conditionalLog(
      actionName,
      {
        projectName,
        projectError,
      },
      true,
    );

    if (projectError) throw projectError;

    // Process each email
    const results = await Promise.all(
      emails.map(async email => {
        try {
          const trimmedEmail = email.trim();
          if (!trimmedEmail) return { success: false, error: "Empty email" };

          // Check if email is valid
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            return {
              success: false,
              error: `Invalid email format: ${trimmedEmail}`,
            };
          }

          // Call the improved invite_member_to_project RPC function
          // This function now returns a single JSON object instead of multiple rows
          const { data, error } = await supabase.rpc(
            "invite_member_to_project",
            {
              p_project_id: projectId,
              p_inviter_id: user.id,
              p_email: trimmedEmail,
              p_role: "member", // Default role
            },
          );

          if (error) throw error;

          // Send invitation email
          await sendInvitationEmail(trimmedEmail, projectName, user.id);

          return { success: true, data };
        } catch (error: any) {
          conditionalLog(actionName, { email, error }, true);
          return {
            success: false,
            error: `Failed to invite ${email}: ${error?.message || "Unknown error"}`,
          };
        }
      }),
    );

    // Summarize results
    const invited = results.filter(r => r.success).length;
    const errors = results.filter(r => !r.success).map(r => r.error);

    conditionalLog(actionName, { invited, errors }, true);

    return getActionResponse({
      data: { invited, errors: errors.filter(Boolean) as string[] },
    });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const removeProjectMemberAction = async (
  memberId: string,
): Promise<ActionResponse<boolean>> => {
  const actionName = "removeProjectMemberAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    // Call the delete_project_member RPC
    const { error } = await supabase.rpc("delete_project_member", {
      p_member_id: memberId,
      p_user_id: user.id,
    });

    conditionalLog(actionName, { error }, true);

    if (error) throw error;
    return getActionResponse({ data: true });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const getProjectMembersAction = async (
  projectId: string,
): Promise<ActionResponse<ProjectMemberWithProfile[]>> => {
  const actionName = "getProjectMembersAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // Fetch project members with profiles
    const { data, error } = await supabase
      .from("project_members")
      .select(
        `
        *,
        profile:profiles(*)
      `,
      )
      .eq("project_id", projectId);

    conditionalLog(actionName, { data, error }, true);

    if (error) throw error;
    return getActionResponse({
      data: data as any as ProjectMemberWithProfile[],
    });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

// Updated function to get project invitations using the enhanced DB function
export const getProjectInvitationsAction = async (
  projectId: string,
): Promise<ActionResponse<ProjectInvitationWithDetails[]>> => {
  const actionName = "getProjectInvitationsAction";
  try {
    const supabase = await getSupabaseServerActionClient();

    // Use the enhanced function that returns ProjectInvitationWithDetails format
    const { data, error } = await supabase.rpc("get_project_invites", {
      p_project_id: projectId,
    });

    conditionalLog(actionName, { data, error }, false);

    if (error) throw error;

    return getActionResponse({
      data: data as any as ProjectInvitationWithDetails[],
    });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

// Function to get user's pending invitations
// Add a new function to get user's pending invitations
export const getUserPendingInvitationsAction = async (): Promise<
  ActionResponse<ProjectInvitationWithDetails[]>
> => {
  const actionName = "getUserPendingInvitationsAction";
  try {
    const supabase = await getSupabaseServerActionClient();

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user || !user.email)
      throw new Error("Not authenticated or missing email");

    // Use the enhanced function that returns ProjectInvitationWithDetails format
    const { data, error } = await supabase.rpc("get_user_pending_invitations", {
      p_email: user.email,
    });

    conditionalLog(actionName, { data, error }, false);

    if (error) throw error;

    return getActionResponse({
      data: data as any as ProjectInvitationWithDetails[],
    });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

// New function to cancel an invitation using the updated delete_project_invitation RPC
export const cancelInvitationAction = async (
  invitationId: string,
): Promise<ActionResponse<boolean>> => {
  const actionName = "cancelInvitationAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    // Call the delete_project_invitation RPC
    const { error } = await supabase.rpc("delete_project_invitation", {
      p_invitation_id: invitationId,
      p_user_id: user.id,
    });

    conditionalLog(actionName, { error }, true);

    if (error) throw error;
    return getActionResponse({ data: true });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const updateProjectMemberAction = async (
  params: UpdateProjectMemberParams,
): Promise<ActionResponse<ProjectMemberWithDetails>> => {
  const actionName = "updateProjectMemberAction";
  try {
    const supabase = await getSupabaseServerActionClient();

    // Get the current user ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Call the database function
    const { data, error } = await supabase.rpc("update_project_member", {
      p_member_id: params.memberId,
      p_user_id: user.id,
      p_role: params.role,
    });

    conditionalLog(actionName, { data, error }, false);

    if (error) throw error;

    return getActionResponse({
      data: data as any as ProjectMemberWithDetails,
    });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
