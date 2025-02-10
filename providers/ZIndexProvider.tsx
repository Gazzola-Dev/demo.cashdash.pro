// providers/ZIndexProvider.tsx
import { Toaster } from "@/components/ui/toaster";
import { DialogRenderer } from "@/hooks/useDialogQueue";
import { ReactNode } from "react";

interface ZIndexProviderProps {
  children: ReactNode;
}

export function ZIndexProvider({ children }: ZIndexProviderProps) {
  return (
    <>
      {children}
      <div className="relative z-[100]">
        <DialogRenderer />
      </div>
      <div className="relative z-[100]">
        <Toaster />
      </div>
    </>
  );
}

export default ZIndexProvider;
