"use client";

import {
  confirmPaymentAction,
  createPaymentIntentAction,
} from "@/actions/billing.actions";
import { BillingTier } from "@/components/layout/BillingModal";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

export const useCreatePaymentIntent = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tier: BillingTier) => {
      const { data, error } = await createPaymentIntentAction(tier);
      if (error) throw new Error(error);
      return data;
    },
    onError: error => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment intent",
        variant: "destructive",
      });
    },
  });
};

export const useConfirmPayment = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      paymentIntentId,
      projectId,
    }: {
      paymentIntentId: string;
      projectId?: string;
    }) => {
      const { data, error } = await confirmPaymentAction(
        paymentIntentId,
        projectId,
      );
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful",
        description: "Your subscription has been activated",
      });
    },
    onError: error => {
      toast({
        title: "Payment Verification Error",
        description: error.message || "Failed to verify payment",
        variant: "destructive",
      });
    },
  });
};
