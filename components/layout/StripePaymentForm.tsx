"use client";

import { Button } from "@/components/ui/button";
import {
  useConfirmPayment,
  useCreatePaymentIntent,
} from "@/hooks/billing.hooks";
import { useToast } from "@/hooks/use-toast";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { BillingTier } from "./BillingModal";

// Initialize Stripe with publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

interface StripeComponentProps {
  tier: BillingTier;
  clientSecret: string;
  onBack: () => void;
}

const StripeCheckoutForm = ({ tier, onBack }: StripeComponentProps) => {
  const { toast } = useToast();
  const elements = useElements();
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);
  const confirmPaymentMutation = useConfirmPayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded
      return;
    }

    setLoading(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        // Show error to your customer
        toast({
          title: "Payment failed",
          description:
            result.error.message || "An error occurred during payment",
          variant: "destructive",
        });
      } else if (
        result.paymentIntent &&
        result.paymentIntent.status === "succeeded"
      ) {
        // Payment succeeded, confirm on server
        await confirmPaymentMutation.mutateAsync({
          paymentIntentId: result.paymentIntent.id,
        });

        // Close the modal after successful payment
        onBack();
      }
    } catch (error: any) {
      toast({
        title: "Payment error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Subscribe to {tier.name} Plan</h3>
        <p className="text-muted-foreground">
          You&apos;ll be charged ${tier.price} per month until you cancel.
        </p>

        <div className="rounded-md border p-4">
          <PaymentElement />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} type="button">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button type="submit" disabled={!stripe || loading}>
          {loading ? "Processing..." : `Pay $${tier.price}`}
        </Button>
      </div>
    </form>
  );
};

interface StripePaymentFormProps {
  tier: BillingTier;
  onBack: () => void;
}

export const StripePaymentForm = ({ tier, onBack }: StripePaymentFormProps) => {
  const { mutateAsync, isPending } = useCreatePaymentIntent();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isFetched, setIsFetched] = useState(false);

  useEffect(() => {
    if (isFetched) return;
    setIsFetched(true);
    const fetchPaymentIntent = async () => {
      try {
        const response = await mutateAsync(tier);
        if (response?.clientSecret) {
          setClientSecret(response.clientSecret);
        }
      } catch (error) {
        console.error("Error fetching payment intent:", error);
      }
    };

    fetchPaymentIntent();
  }, [mutateAsync, tier, isFetched]);

  if (isPending || !clientSecret) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Loading payment form...</h3>
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
        },
      }}
    >
      <StripeCheckoutForm
        tier={tier}
        clientSecret={clientSecret}
        onBack={onBack}
      />
    </Elements>
  );
};

export default StripePaymentForm;
