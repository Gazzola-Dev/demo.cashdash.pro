"use client";

import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/stores/app.store";
import {
  ContractPaymentWithDetails,
  ContractWithMembers,
} from "@/types/app.types";
import { useCallback, useState } from "react";

/**
 * Hook for creating payment intent
 */
export const useCreatePaymentIntent = () => {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const createPaymentIntent = useCallback(
    async (totalAmountCents: number) => {
      setIsPending(true);
      try {
        // Mock implementation - in a real app this would call an API
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const clientSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 10)}`;

        return {
          clientSecret,
          paymentIntentId: `pi_${Date.now()}`,
          amount: totalAmountCents,
        };
      } catch (error) {
        console.error("Error creating payment intent:", error);
        toast({
          title: "Payment Error",
          description: "Failed to create payment intent",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [toast],
  );

  return {
    createPaymentIntent,
    isPending,
  };
};

/**
 * Hook for confirming payment
 */
export const useConfirmPayment = () => {
  const { toast } = useToast();
  const { project, contract, setContract } = useAppData();
  const [isPending, setIsPending] = useState(false);

  const confirmPayment = useCallback(
    async ({ paymentIntentId }: { paymentIntentId: string }) => {
      if (!project?.id || !contract) {
        toast({
          title: "Error",
          description: "Project or contract not found",
          variant: "destructive",
        });
        return null;
      }

      setIsPending(true);
      try {
        // Mock implementation - in a real app this would call an API
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create a mock payment record
        const paymentRecord: ContractPaymentWithDetails = {
          id: `payment_${Date.now()}`,
          contract_id: contract.id as string,
          amount_cents: contract.total_amount_cents || 0,
          status: "completed",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          payment_id: paymentIntentId,
          payment_date: new Date().toISOString(),
          milestone_id: project?.current_milestone_id || null,
          payment_method: "card",
          transaction_id: `txn_${Date.now()}`,
          payee_id: null,
          payer_id: null,
        };

        // Update the contract with the new payment
        setContract({
          ...contract,
          payments: [...(contract.payments || []), paymentRecord],
        });

        toast({
          title: "Payment Successful",
          description:
            "Contract payment was successful, the milestone is now active.",
        });

        return paymentRecord;
      } catch (error) {
        console.error("Error confirming payment:", error);
        toast({
          title: "Payment Verification Error",
          description: "Failed to verify payment",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [project, contract, setContract, toast],
  );

  return {
    confirmPayment,
    isPending,
  };
};

/**
 * Hook for contract billing
 */
export function useContractBilling() {
  const { contract, setContract } = useAppData();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  // Add PaymentMethod interface to define the structure
  interface PaymentMethod {
    id: string;
    type: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    is_default: boolean;
  }

  // Extend ContractWithMembers to include payment_methods
  interface ContractWithPaymentMethods extends ContractWithMembers {
    payment_methods?: PaymentMethod[];
  }

  // Generate an invoice for a contract
  const generateInvoice = useCallback(
    (contractId: string) => {
      if (!contract || contract.id !== contractId) {
        toast({
          title: "Contract not found",
          description: "The specified contract could not be found.",
          variant: "destructive",
        });
        return null;
      }

      setIsPending(true);
      try {
        // In a real implementation, you would call an API here
        // For now, create a mock invoice
        const invoiceData = {
          id: `invoice-${Date.now()}`,
          contract_id: contractId,
          amount_cents: contract.total_amount_cents || 0,
          status: "pending",
          due_date: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          created_at: new Date().toISOString(),
        };

        toast({
          title: "Invoice generated",
          description: "Invoice has been generated successfully.",
        });

        return invoiceData;
      } catch (error) {
        console.error("Error generating invoice:", error);
        toast({
          title: "Failed to generate invoice",
          description:
            "There was an error generating the invoice. Please try again.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [contract, toast],
  );

  // Add payment method to contract
  const addPaymentMethod = useCallback(
    (paymentMethodData: {
      type: string;
      last4: string;
      expMonth: number;
      expYear: number;
    }) => {
      if (!contract) {
        toast({
          title: "No contract selected",
          description: "Please select a contract before adding payment method.",
          variant: "destructive",
        });
        return null;
      }

      setIsPending(true);
      try {
        // Cast the contract to the extended interface
        const contractWithPaymentMethods =
          contract as ContractWithPaymentMethods;

        // Create the updated contract with the new payment method
        const updatedContract: ContractWithPaymentMethods = {
          ...contractWithPaymentMethods,
          payment_methods: [
            ...(contractWithPaymentMethods.payment_methods || []),
            {
              id: `pm_${Date.now()}`,
              type: paymentMethodData.type,
              last4: paymentMethodData.last4,
              exp_month: paymentMethodData.expMonth,
              exp_year: paymentMethodData.expYear,
              is_default: !contractWithPaymentMethods.payment_methods?.length,
            },
          ],
        };

        // Update contract in state
        setContract(updatedContract);

        toast({
          title: "Payment method added",
          description: "Your payment method has been added successfully.",
        });

        return updatedContract;
      } catch (error) {
        console.error("Error adding payment method:", error);
        toast({
          title: "Failed to add payment method",
          description:
            "There was an error adding your payment method. Please try again.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [contract, setContract, toast],
  );

  // Process a payment for a milestone
  const processPayment = useCallback(
    async (milestoneId: string, amountCents: number) => {
      if (!contract) {
        toast({
          title: "No contract selected",
          description: "Please select a contract before processing payment.",
          variant: "destructive",
        });
        return null;
      }

      setIsPending(true);
      try {
        // Mock implementation - simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Create a new payment record
        const paymentRecord: ContractPaymentWithDetails = {
          id: `payment_${Date.now()}`,
          contract_id: contract.id as string,
          amount_cents: amountCents,
          status: "completed",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          milestone_id: milestoneId,
          payment_date: new Date().toISOString(),
          payment_method: "card",
          transaction_id: `txn_${Date.now()}`,
          payment_id: `pi_${Date.now()}`,
          payee_id: null,
          payer_id: null,
        };

        // Update the contract with the new payment
        setContract({
          ...contract,
          payments: [...(contract.payments || []), paymentRecord],
        });

        toast({
          title: "Payment processed",
          description: "Payment has been processed successfully.",
        });

        return paymentRecord;
      } catch (error) {
        console.error("Error processing payment:", error);
        toast({
          title: "Failed to process payment",
          description:
            "There was an error processing the payment. Please try again.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [contract, setContract, toast],
  );

  // Get payment methods
  const getPaymentMethods = useCallback(() => {
    if (!contract) {
      return [];
    }

    // Cast the contract to the extended interface
    const contractWithPaymentMethods = contract as ContractWithPaymentMethods;

    // Return the payment methods or an empty array
    return contractWithPaymentMethods.payment_methods || [];
  }, [contract]);

  // Get payment history
  const getPaymentHistory = useCallback(() => {
    if (!contract) {
      return [];
    }

    // Return the payments or an empty array
    return contract.payments || [];
  }, [contract]);

  return {
    contract,
    isPending,
    generateInvoice,
    addPaymentMethod,
    processPayment,
    getPaymentMethods,
    getPaymentHistory,
  };
}
