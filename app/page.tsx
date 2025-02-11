"use client";

import { AuthenticatedHome } from "@/components/home/AuthenticatedHome";
import { UnauthenticatedHome } from "@/components/home/UnAuthenticatedHome";
import { useGetUser } from "@/hooks/user.hooks";

export default function HomePage() {
  const { data: user } = useGetUser();

  if (!user) {
    return <UnauthenticatedHome />;
  }

  return <AuthenticatedHome user={user} />;
}
