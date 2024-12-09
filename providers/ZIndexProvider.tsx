"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useDialogQueue } from "@/hooks/useDialogQueue";
import { useToastQueue } from "@/hooks/useToastQueue";
import { ReactNode } from "react";

export const ZIndexProvider = ({ children }: { children: ReactNode }) => {
  const { toasts, dismiss: dismissToast } = useToastQueue();
  const { dialogs } = useDialogQueue();

  return (
    <>
      <ToastProvider>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            open={toast.open}
            onOpenChange={() => dismissToast(toast.id)}
          >
            <div>
              <ToastTitle>{toast.title}</ToastTitle>
              {toast.description && (
                <ToastDescription>{toast.description}</ToastDescription>
              )}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>

      {dialogs.map(dialog => (
        <Dialog
          key={dialog.id}
          open={dialog.open}
          onOpenChange={open => dialog.onOpenChange?.(open)}
        >
          <DialogContent>{dialog.component}</DialogContent>
        </Dialog>
      ))}
      {children}
    </>
  );
};
