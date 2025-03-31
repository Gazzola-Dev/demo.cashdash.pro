"use client";

import { Toaster } from "@/components/ui/toaster";
import { DialogRenderer } from "@/hooks/useDialogQueue";
import { ReactNode } from "react";

export function ZIndexProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <DialogRenderer />
      <Toaster />
    </>
  );
}
