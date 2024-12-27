"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import configuration from "@/configuration";
import { useCreateProject } from "@/hooks/project.hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Project name is required" })
    .max(50, { message: "Project name cannot exceed 50 characters" }),
  prefix: z
    .string()
    .min(2, { message: "Prefix must be at least 2 characters" })
    .max(5, { message: "Prefix cannot exceed 5 characters" })
    .regex(/^[A-Z]+$/, { message: "Prefix must be uppercase letters only" }),
  slug: z
    .string()
    .min(1, { message: "Slug is required" })
    .max(50, { message: "Slug cannot exceed 50 characters" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug must contain only lowercase letters, numbers, and hyphens",
    }),
  github_repo_url: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const { mutate: createProject, isPending: isLoading } = useCreateProject();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      prefix: "",
      slug: "",
      github_repo_url: "",
    },
  });

  const { isValid } = form.formState;
  const watchedValues = form.watch();
  const formIsValid =
    isValid && watchedValues.name && watchedValues.prefix && watchedValues.slug;

  async function onSubmit(data: FormValues) {
    createProject(
      {
        ...data,
        status: "active",
      },
      {
        onSuccess: () => {
          router.push(
            configuration.paths.project.overview({ project_slug: data.slug }),
          );
        },
      },
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Awesome Project" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Prefix</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="MAP"
                        {...field}
                        onChange={e =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="my-awesome-project"
                        {...field}
                        onChange={e =>
                          field.onChange(e.target.value.toLowerCase())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="github_repo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Repository URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://github.com/username/repository"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !formIsValid}
              >
                {isLoading ? "Creating..." : "Create Project"}
                {!isLoading && <Plus className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
