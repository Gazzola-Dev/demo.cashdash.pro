"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  StripeElements,
  StripePaymentElementOptions,
  loadStripe,
} from "@stripe/stripe-js";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { BillingTier } from "./BillingModal";

// Initialize Stripe with your publishable key
// In a real implementation, this should be an environment variable
const stripePromise = loadStripe("pk_test_your_publishable_key");

interface StripeComponentProps {
  id?: string;
  options?: StripePaymentElementOptions;
  tier: BillingTier;
  onBack: () => void;
}

const StripeComponent = ({
  id = "payment-element",
  options,
  tier,
  onBack,
}: StripeComponentProps) => {
  const { toast } = useToast();
  const elements = useElements();
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setLoading(true);

    try {
      // Confirm the payment
      const result = await stripe.confirmPayment({
        elements: elements as StripeElements,
        confirmParams: {
          return_url: `${window.location.origin}/settings/billing/success`,
        },
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
      } else {
        // Payment succeeded
        toast({
          title: "Payment successful",
          description: `You are now subscribed to the ${tier.name} plan`,
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment error",
        description: "An unexpected error occurred",
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
          <PaymentElement id={id} options={options} />
        </div>
      </div>
    </form>
  );
};

interface StripePaymentFormProps {
  tier: BillingTier;
  onBack: () => void;
}

export const StripePaymentForm = ({ tier, onBack }: StripePaymentFormProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // In a real implementation, you'd fetch the client secret from your backend
    // This is just a placeholder for demonstration purposes
    const fetchPaymentIntent = async () => {
      try {
        // Replace with actual API call
        // const response = await fetch('/api/create-payment-intent', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ tier: tier.name, price: tier.price }),
        // });
        // const data = await response.json();
        // setClientSecret(data.clientSecret);

        // Simulating a successful response for demo purposes
        setTimeout(() => {
          setClientSecret(
            "pi_mock_secret_" + Math.random().toString(36).substring(2, 15),
          );
        }, 1000);
      } catch (error) {
        console.error("Error fetching payment intent:", error);
      }
    };

    fetchPaymentIntent();
  }, [tier]);

  if (!clientSecret) {
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
          labels: "floating",
        },
      }}
    >
      <StripeComponent tier={tier} onBack={onBack} />
    </Elements>
  );
};

export default StripePaymentForm;
