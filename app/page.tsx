"use client";

import ActionButton from "@/components/shared/ActionButton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  useGetUser,
  useSignInWithMagicLink,
  useSignOut,
} from "@/hooks/user.hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut, MailOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

export default function HomePage() {
  const { mutate: signInWithMagicLink, isPending: isSigningIn } =
    useSignInWithMagicLink();
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();
  const { data: user } = useGetUser();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const emailValue = form.watch("email");
  const { isValid } = form.formState;
  const emailIsValid = emailValue && isValid;

  const handleSubmit = (data: FormValues) => {
    signInWithMagicLink(data.email);
  };

  const handleSignOut = () => {
    signOut();
  };

  // Redact email for display, keeping first 2 and last 2 chars visible
  const redactEmail = (email: string) => {
    const [localPart, domain] = email.split("@");
    const redactedLocal =
      localPart.slice(0, 2) + "*".repeat(localPart.length - 2);
    const [domainName, tld] = domain.split(".");
    const redactedDomain =
      domainName.slice(0, 2) + "*".repeat(domainName.length - 2);
    return `${redactedLocal}@${redactedDomain}.${tld}`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Cash Dash Pro
          </h1>
          <p className="text-muted-foreground">AI-powered project management</p>
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm">
          {!user ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          type="email"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <ActionButton
                  type="submit"
                  className="w-full"
                  disabled={!emailIsValid || isSigningIn}
                  loading={isSigningIn}
                >
                  {isSigningIn ? (
                    "Sending..."
                  ) : (
                    <>
                      Send Magic Link
                      <MailOpen className="ml-2 h-4 w-4" />
                    </>
                  )}
                </ActionButton>
              </form>
            </Form>
          ) : (
            <div className="flex flex-col items-center">
              <h1 className=" tracking-tight mb-2">
                Welcome, {user?.email ? redactEmail(user?.email) : ""}
              </h1>

              <ActionButton
                onClick={handleSignOut}
                className="w-full"
                disabled={isSigningOut}
                loading={isSigningOut}
              >
                {isSigningOut ? (
                  "Signing out..."
                ) : (
                  <>
                    Sign out
                    <LogOut className="ml-2 h-4 w-4" />
                  </>
                )}
              </ActionButton>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
