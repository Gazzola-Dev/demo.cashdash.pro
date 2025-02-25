"use client";

import { useGetAppData } from "@/hooks/app.hooks";
import { useToast } from "@/hooks/use-toast";
import useSupabase from "@/hooks/useSupabase";
import { useAppData } from "@/stores/app.store";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AuthConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = useSupabase();
  const { toast } = useToast();
  const { refetch } = useGetAppData();
  const { setUser } = useAppData();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get token hash and type from URL
        const token_hash = searchParams.get("token_hash");
        const type = searchParams.get("type");

        if (token_hash && type) {
          const res = await supabase?.auth.verifyOtp({
            token_hash,
            type: type as any,
          });

          if (res?.error) throw res?.error;

          // Show success message
          toast({
            title: "Email verified",
            description: "Your email has been verified successfully.",
          });

          const userRes = await supabase?.auth.getUser();
          const user = userRes?.data;
          if (user?.user) setUser(user?.user);
          refetch();
          router.push("/");
        }
      } catch (error: any) {
        console.error("Error during email confirmation:", error);
        toast({
          title: "Verification failed",
          description:
            error.message || "Failed to verify email. Please try again.",
          variant: "destructive",
        });
        router.push("/");
      }
    };

    handleEmailConfirmation();
  }, [searchParams, router, supabase?.auth, toast, refetch]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Verifying your email...</h1>
        <p className="text-muted-foreground">
          Please wait while we verify your email address.
        </p>
      </div>
    </div>
  );
}
