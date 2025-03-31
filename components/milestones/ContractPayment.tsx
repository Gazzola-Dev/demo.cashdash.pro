"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useContractPayment } from "@/hooks/contract.hooks";
import { CheckCircle, CreditCard, LockIcon } from "lucide-react";

export const ContractPayment = () => {
  const {
    contract,
    isProjectManager,
    isPaid,
    paymentData,
    allMembersApproved,
    getPendingMemberNames,
    handleProcessPayment,
    isPending,
  } = useContractPayment();

  if (!contract) {
    return null;
  }

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Get total amount
  const totalAmount = contract?.total_amount_cents
    ? contract.total_amount_cents / 100
    : 0;

  // If already paid, show payment summary
  if (isPaid && paymentData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-4 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold">Payment Complete</h3>
            </div>

            <Separator className="mb-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Amount:</span>
                <span className="font-semibold">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Date:</span>
                <span>
                  {paymentData.payment_date
                    ? formatDate(paymentData.payment_date)
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Status:</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Paid
                </span>
              </div>
              {paymentData.transaction_id && (
                <div className="flex justify-between">
                  <span className="text-sm">Transaction ID:</span>
                  <span className="text-xs font-mono">
                    {paymentData.transaction_id.substring(0, 16)}...
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payment Information</CardTitle>
      </CardHeader>
      <CardContent>
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
            <div className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <div>
                  <h4 className="font-medium">Process Payment</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    All members have approved. Process the payment of{" "}
                    {formatCurrency(totalAmount)}.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleProcessPayment}
                disabled={isPending}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                id="payment-button"
              >
                Pay {formatCurrency(totalAmount)}
              </Button>
            </div>
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
      </CardContent>
    </Card>
  );
};

export default ContractPayment;
