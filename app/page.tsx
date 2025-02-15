"use client";

import { AuthenticatedHome } from "@/components/home/AuthenticatedHome";
import { UnauthenticatedHome } from "@/components/home/UnAuthenticatedHome";
import useAppStore from "@/hooks/app.store";

export default function HomePage() {
  const { user } = useAppStore();

  if (!user) {
    return <UnauthenticatedHome />;
  }

  return <AuthenticatedHome user={user} />;
}
