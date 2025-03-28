"use client";

import { Button } from "@/components/ui/button";
import {
  useConfirmPayment,
  useCreatePaymentIntent,
} from "@/hooks/billing.hooks";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/stores/app.store";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

// Initialize Stripe with publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

interface StripeComponentProps {
  clientSecret: string;
}

const StripeCheckoutForm = ({ clientSecret }: StripeComponentProps) => {
  const { toast } = useToast();
  const elements = useElements();
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);
  const confirmPaymentMutation = useConfirmPayment();
  const { contract } = useAppData();

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
        <div className="rounded-md border p-4">
          <PaymentElement />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!stripe || loading}>
          {loading
            ? "Processing..."
            : `Pay $${(contract?.total_amount_cents ?? 0) / 100}`}
        </Button>
      </div>
    </form>
  );
};

export const StripePaymentForm = () => {
  const { mutateAsync, isPending } = useCreatePaymentIntent();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isFetched, setIsFetched] = useState(false);

  const { contract } = useAppData();
  useEffect(() => {
    if (isFetched) return;
    setIsFetched(true);
    const fetchPaymentIntent = async () => {
      try {
        const total = contract?.total_amount_cents;
        if (!total) throw new Error("Invalid total amount");
        const response = await mutateAsync(total);
        if (response?.clientSecret) {
          setClientSecret(response.clientSecret);
        }
      } catch (error) {
        console.error("Error fetching payment intent:", error);
      }
    };

    fetchPaymentIntent();
  }, [mutateAsync, isFetched, contract]);

  if (isPending || !clientSecret) {
    return (
      <div className="flex flex-col space-y-4">
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
      <StripeCheckoutForm clientSecret={clientSecret} />
    </Elements>
  );
};

export default StripePaymentForm;
