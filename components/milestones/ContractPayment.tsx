// components/milestones/ContractPayment.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/contract.util";
import { ContractMember } from "@/types/app.types";
import {
  CheckCircle,
  CreditCard,
  DollarSign,
  LoaderCircle,
  LockIcon,
} from "lucide-react";
import { useState } from "react";

interface ContractInfo {
  id: string;
  title: string;
  price: number;
  project_id: string;
  startDate: Date;
  tasks: {
    id: string;
    ordinal_id: number;
    title: string;
    description: string | null;
  }[];
  members: ContractMember[];
}

interface ContractPaymentProps {
  contract: ContractInfo;
  currentUser: ContractMember;
  allMembers: ContractMember[];
  expanded: boolean; // Control visibility based on parent component state
  allPMsApproved: boolean; // New prop to directly indicate if all PMs have approved
}

export const ContractPayment: React.FC<ContractPaymentProps> = ({
  contract,
  currentUser,
  allMembers,
  expanded,
  allPMsApproved,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  // Check if all project managers have approved
  const projectManagers = allMembers.filter(
    member => member.role === "project manager" || member.role === "admin",
  );
  const approvedPMs = projectManagers.filter(pm => pm.hasApproved);

  // Use the provided prop directly to determine if all PMs have approved
  // This ensures we're using the most up-to-date approval state

  const getPendingPMNames = () => {
    const pendingPMs = projectManagers.filter(pm => !pm.hasApproved);
    return pendingPMs.map(pm => pm.display_name || "Unnamed User").join(", ");
  };

  const handleShowPaymentForm = () => {
    setShowForm(true);
  };

  const handleProcessPayment = () => {
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
      setPaymentDate(new Date());
      setShowForm(false);
    }, 2000);
  };

  // Only show component if the card is expanded
  if (!expanded) {
    return null;
  }

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
            <span className="font-semibold">
              {formatCurrency(contract.price)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Date:</span>
            <span>{formatDate(paymentDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Paid by:</span>
            <span>{currentUser.display_name || currentUser.email}</span>
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
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <DollarSign className="h-5 w-5" />
          Payment
        </h3>
        <div className="flex justify-between mb-4">
          <span className="font-medium">Contract Total:</span>
          <span className="font-bold text-lg">
            {formatCurrency(contract.price)}
          </span>
        </div>

        <Separator className="my-4" />

        {!allPMsApproved ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <LockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h4 className="font-medium text-amber-800 dark:text-amber-300">
                Payment Locked
              </h4>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              All project managers must approve this contract before payment can
              be processed.
            </p>
            <p className="text-sm mt-2 font-medium text-amber-800 dark:text-amber-300">
              Waiting for approval from: {getPendingPMNames()}
            </p>
          </div>
        ) : showForm ? (
          <div className="border rounded-md p-4 space-y-4">
            <div className="text-sm font-medium mb-2">Payment Details</div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="John Smith"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                  />
                  <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={e => setCardExpiry(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={cardCvc}
                    onChange={e => setCardCvc(e.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleProcessPayment}
                disabled={
                  isProcessing ||
                  !cardNumber ||
                  !cardExpiry ||
                  !cardCvc ||
                  !cardName
                }
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>Pay {formatCurrency(contract.price)}</>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-2">
                Your payment information is secure and encrypted.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <Button onClick={handleShowPaymentForm} className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Proceed to Payment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractPayment;
