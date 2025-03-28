"use server";

import getSupabaseServerActionClient from "@/clients/action-client";
import getActionResponse from "@/lib/action.util";
import { conditionalLog } from "@/lib/log.utils";
import { ActionResponse } from "@/types/action.types";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const createPaymentIntentAction = async (
  totalAmountCents: number,
): Promise<ActionResponse<{ clientSecret: string }>> => {
  const actionName = "createPaymentIntentAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) throw new Error("Not authenticated");

    conditionalLog(actionName, { totalAmountCents }, true);

    // Calculate amount in cents

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountCents,
      currency: "aud",
      description: `${totalAmountCents / 100} contract payment`,
      metadata: {
        userId: user.id,
      },
    });

    conditionalLog(actionName, { paymentIntentId: paymentIntent.id }, true);

    return getActionResponse({
      data: { clientSecret: paymentIntent.client_secret as string },
    });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};

export const confirmPaymentAction = async (
  paymentIntentId: string,
  projectId?: string,
): Promise<ActionResponse<boolean>> => {
  const actionName = "confirmPaymentAction";

  try {
    const supabase = await getSupabaseServerActionClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) throw new Error("Not authenticated");

    conditionalLog(actionName, { paymentIntentId, projectId }, true);

    // If projectId is provided, verify the user is a member of this project
    if (projectId) {
      const { data: memberData, error: memberError } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .single();

      if (memberError || !memberData) {
        throw new Error("You must be a member of the project to subscribe");
      }

      // Check if this project already has a subscription
      const { data: existingSubscription, error: subError } = await supabase
        .from("project_subscriptions")
        .select("id")
        .eq("project_id", projectId)
        .maybeSingle();

      if (existingSubscription) {
        throw new Error("This project already has an active subscription");
      }
    }

    // Retrieve the payment intent to confirm its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new Error("Payment has not been completed");
    }

    // Store the payment record in your database
    const { data, error } = await supabase
      .from("project_subscriptions")
      .insert({
        project_id: projectId,
        user_id: user.id,
        payment_intent_id: paymentIntentId,
        amount_cents: paymentIntent.amount,
        status: "active",
        tier: paymentIntent.metadata.tierName,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      });

    if (error) throw error;

    // If this is for a specific project, update the project's subscription status
    if (projectId) {
      const { error: projectError } = await supabase
        .from("projects")
        .update({ subscription_status: "active" })
        .eq("id", projectId);

      if (projectError) throw projectError;
    }

    return getActionResponse({ data: true });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
