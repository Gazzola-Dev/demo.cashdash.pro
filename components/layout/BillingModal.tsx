import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

// Define the billing tier properties
interface BillingTier {
  name: string;
  stars: number;
  features: Record<string, boolean | string | number>;
  price: number;
  disabled?: boolean;
}

// Define the billing tiers and their features
const billingTiers: BillingTier[] = [
  {
    name: "Basic",
    stars: 1,
    features: {
      projectLimit: 1,
      pmPerProject: 1,
      projectMemberLimit: 3,
      taskManagement: true,
      taskComments: true,
      dashboard: false,
      taskLimit: 500,
      aiReports: false,
      weeklyReports: false,
    },
    price: 9,
  },
  {
    name: "Pro",
    stars: 2,
    features: {
      projectLimit: 3,
      pmPerProject: 3,
      projectMemberLimit: 10,
      taskManagement: true,
      taskComments: true,
      dashboard: true,
      taskLimit: 1000,
      aiReports: true,
      weeklyReports: false,
    },
    price: 99,
  },
  {
    name: "Enterprise",
    stars: 3,
    features: {
      projectLimit: "∞",
      pmPerProject: "∞",
      projectMemberLimit: "∞",
      taskManagement: true,
      taskComments: true,
      dashboard: true,
      taskLimit: "∞",
      aiReports: true,
      weeklyReports: true,
    },
    price: 999,
    disabled: true,
  },
];

// Feature list descriptions for the table
const featuresList = [
  { key: "pmPerProject", label: "Managers" },
  { key: "projectMemberLimit", label: "Members" },
  { key: "taskLimit", label: "Tasks" },
  { key: "dashboard", label: "Dashboard" },
  { key: "aiReports", label: "Monthly AI reports" },
  {
    key: "weeklyReports",
    label: "Weekly reports",
  },
];

// Mock Stripe payment form component
const MockStripeForm = ({
  tier,
  onBack,
}: {
  tier: BillingTier;
  onBack: () => void;
}) => {
  return <div className="space-y-4"></div>;
};

export function BillingModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedTier, setSelectedTier] = useState<BillingTier | null>(null);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);

  const handleSelectTier = (tier: BillingTier, index: number) => {
    if (tier.disabled) return;
    setSelectedTierIndex(index);
  };

  const handleProceedToPayment = () => {
    const tier = billingTiers[selectedTierIndex];
    if (tier.disabled) return;
    setSelectedTier(tier);
    setCurrentPage(2);
  };

  const handleBack = () => {
    setSelectedTier(null);
    setCurrentPage(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        {currentPage === 2 ? (
          <MockStripeForm
            tier={billingTiers[selectedTierIndex]}
            onBack={handleBack}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Pricing Plans</DialogTitle>
              <DialogDescription>
                Choose the appropriate pricing plan for this project. Each
                project requires a separate plan. Prices are in USD.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-2 border-b"></th>
                    {billingTiers.map((tier, index) => (
                      <th
                        key={tier.name}
                        className={cn(
                          "p-2 border-b text-center cursor-pointer transition-colors",
                          selectedTierIndex === index && !tier.disabled
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : "",
                          tier.disabled ? "cursor-not-allowed" : "",
                        )}
                        onClick={() => handleSelectTier(tier, index)}
                      >
                        <div className="flex flex-col items-center">
                          <div className="text-lg font-medium">{tier.name}</div>
                          <div className="flex items-center mt-1">
                            {Array.from({ length: tier.stars }).map((_, i) => (
                              <svg
                                key={i}
                                className="w-4 h-4 text-yellow-400 fill-current"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featuresList.map(feature => (
                    <tr
                      key={feature.key}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <td className="p-2 text-base font-semibold tracking-wide">
                        {feature.label}
                      </td>
                      {billingTiers.map((tier, index) => {
                        const featureValue =
                          tier.features[
                            feature.key as keyof typeof tier.features
                          ];
                        return (
                          <td
                            key={`${tier.name}-${feature.key}`}
                            className={cn(
                              "p-2 text-center cursor-pointer transition-colors",
                              selectedTierIndex === index && !tier.disabled
                                ? "bg-blue-50 dark:bg-blue-900/20"
                                : "",
                              tier.disabled ? "cursor-not-allowed" : "",
                            )}
                            onClick={() => handleSelectTier(tier, index)}
                          >
                            {typeof featureValue === "boolean" ? (
                              featureValue ? (
                                <Check className="mx-auto h-6 w-6 text-green-500" />
                              ) : null
                            ) : (
                              <div
                                className={cn(
                                  "text-base text-gray-900 dark:text-gray-100 font-bold",
                                  featureValue === "∞"
                                    ? "text-xl text-gray-600"
                                    : "",
                                )}
                              >
                                {featureValue}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="p-2"></td>
                    {billingTiers.map((tier, index) => (
                      <td
                        key={`${tier.name}-price`}
                        className={cn(
                          "p-2 cursor-pointer transition-colors",
                          selectedTierIndex === index && !tier.disabled
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : "",
                          tier.disabled ? "cursor-not-allowed" : "",
                        )}
                        onClick={() => handleSelectTier(tier, index)}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center py-2 px-4 rounded-md transition-all border border-transparent italic text-blue-950 dark:text-blue-100",
                            selectedTierIndex === index && !tier.disabled
                              ? "border-blue-500  dark:bg-blue-700/10"
                              : "bg-gray-100/10 dark:bg-gray-800/10 ",
                          )}
                        >
                          <div className="h-8 flex flex-col">
                            <span className="tex-xs">$</span>
                          </div>
                          <span className="font-bold text-lg">
                            {tier.price}
                          </span>
                          <span className="ml-1 tex-xs">per month</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={false}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            {currentPage !== 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              onClick={handleProceedToPayment}
              disabled={
                billingTiers[selectedTierIndex]?.disabled || currentPage === 2
              }
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BillingModal;
