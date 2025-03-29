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

    // Retrieve the payment intent to get transaction details
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new Error("Payment has not been completed");
    }

    // Get transaction details
    const transactionId = paymentIntent.latest_charge as string;
    let paymentMethod = "stripe";

    // Fetch charge details to get payment method info if needed
    if (transactionId) {
      const charge = await stripe.charges.retrieve(transactionId);
      if (charge.payment_method_details?.type) {
        paymentMethod = charge.payment_method_details.type;
      }
    }

    // Call the database function to record the payment
    const { data } = await supabase.rpc("confirm_contract_payment", {
      p_payment_intent_id: paymentIntentId,
      p_user_id: user.id,
      p_project_id: projectId || undefined,
      p_transaction_id: transactionId || undefined,
      p_payment_method: paymentMethod,
    });

    const error = (data as any)?.error;

    if (error) throw error;
    conditionalLog(actionName, { data, error }, true);

    if (!data) {
      throw new Error("Failed to confirm payment");
    }

    return getActionResponse({ data: true });
  } catch (error) {
    conditionalLog(actionName, { error }, true);
    return getActionResponse({ error });
  }
};
