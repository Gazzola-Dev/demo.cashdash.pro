// components/home/UnauthenticatedHome.tsx
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSignInWithMagicLink } from "@/hooks/user.hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailOpen } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email("Please enter a valid email address"),
  password: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function UnauthenticatedHome() {
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const { mutate: signInWithMagicLink, isPending: isSigningIn } =
    useSignInWithMagicLink();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const emailValue = form.watch("email");
  const { isValid } = form.formState;
  const emailIsValid = emailValue && isValid;

  const handleSubmit = (data: FormValues) => {
    signInWithMagicLink(data.email);
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

              {/* <Collapsible
                open={isPasswordMode}
                onOpenChange={setIsPasswordMode}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-between"
                  >
                    {isPasswordMode ? "Use Magic Link" : "Use Password"}
                    <KeyRound className="h-4 w-4 ml-2" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="current-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible> */}

              <Button
                type="submit"
                className="w-full"
                disabled={!emailIsValid || isSigningIn}
              >
                {isSigningIn ? (
                  "Sending..."
                ) : (
                  <>
                    Send Magic Link
                    <MailOpen className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
}
