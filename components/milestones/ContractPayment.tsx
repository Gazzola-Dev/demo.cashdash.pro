"use client";

import StripePaymentForm from "@/components/layout/StripePaymentForm";
import { Separator } from "@/components/ui/separator";
import { useContractMembers, useContractRole } from "@/hooks/contract.hooks";
import { formatCurrency } from "@/lib/contract.util";
import { CheckCircle, CreditCard, LockIcon } from "lucide-react";
import { useState } from "react";

export const ContractPayment = () => {
  const { isProjectManager } = useContractRole();
  const { contract } = useContractMembers();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  // Form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  if (!contract) {
    return null;
  }

  // Check if all members have approved
  const allMembersApproved =
    contract.members?.every(member => member.hasApproved) || false;

  // Get names of members who haven't approved
  const getPendingMemberNames = () => {
    const pendingMembers =
      contract.members?.filter(member => !member.hasApproved) || [];
    return pendingMembers
      .map(member => member.display_name || "Unnamed User")
      .join(", ");
  };

  // No handleShowPaymentForm function needed

  const handleProcessPayment = () => {
    if (!isProjectManager) return;

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
      setPaymentDate(new Date());
    }, 2000);
  };

  const totalAmount = contract?.total_amount_cents
    ? contract.total_amount_cents / 100
    : 0;

  // Format date helper
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // If already paid, show payment summary
  if (isPaid && paymentDate) {
    return (
      <div className="mt-6 border rounded-md p-4 bg-green-50 dark:bg-green-900/20">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold">Payment Complete</h3>
        </div>

        <Separator className="mb-4" />

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Amount:</span>
            <span className="font-semibold">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Date:</span>
            <span>{formatDate(paymentDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Status:</span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              Paid
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-4">
        <Separator className="my-4" />

        {!allMembersApproved ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <LockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h4 className="font-medium text-amber-800 dark:text-amber-300">
                Payment Locked
              </h4>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              All contract members must approve this contract before payment can
              be processed.
            </p>
            <p className="text-sm mt-2 font-medium text-amber-800 dark:text-amber-300">
              Waiting for approval from: {getPendingMemberNames()}
            </p>
          </div>
        ) : allMembersApproved && isProjectManager ? (
          <div className="border rounded-md p-4 space-y-4">
            <StripePaymentForm />
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <div className="rounded-md border border-slate-200 p-4 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <h4 className="font-medium">Payment Options</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isProjectManager
                  ? "All members have approved, but you haven't initiated payment."
                  : "Only project managers can process payments for contracts."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractPayment;
