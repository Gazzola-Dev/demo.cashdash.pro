"use client";

import {
  confirmPaymentAction,
  createPaymentIntentAction,
} from "@/actions/billing.actions";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/stores/app.store";
import { useMutation } from "@tanstack/react-query";

export const useCreatePaymentIntent = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (totalAmountCents: number) => {
      const { data, error } = await createPaymentIntentAction(totalAmountCents);
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
  const { project } = useAppData();

  return useMutation({
    mutationFn: async ({ paymentIntentId }: { paymentIntentId: string }) => {
      const { data, error } = await confirmPaymentAction(
        paymentIntentId,
        project?.id,
      );
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful",
        description:
          "Contract payment was successful, the milestone is now active.",
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
