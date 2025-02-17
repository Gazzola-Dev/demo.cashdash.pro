import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { create } from "zustand";

interface DialogOptions {
  title: string;
  description: string;
  variant?: "default" | "destructive";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface Dialog extends DialogOptions {
  id: string;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DialogStore {
  dialogs: Dialog[];
  addDialog: (dialog: Dialog) => void;
  dismissDialog: () => void;
  removeDialog: (dialogId: string) => void;
}

// Generate unique ID for each dialog
function genId() {
  return `${Date.now()}-${Math.random()}`;
}

// Create Zustand store for dialogs
const useDialogStore = create<DialogStore>(set => ({
  dialogs: [],
  addDialog: dialog =>
    set(state => ({
      dialogs: [dialog, ...state.dialogs],
    })),
  dismissDialog: () =>
    set(state => ({
      dialogs: state.dialogs.map((d, index) =>
        index === 0 ? { ...d, open: false } : d,
      ),
    })),
  removeDialog: dialogId =>
    set(state => ({
      dialogs: state.dialogs.filter(d => d.id !== dialogId),
    })),
}));

// Custom hook for managing dialog queue
export function useDialogQueue() {
  const { dialogs, addDialog, dismissDialog, removeDialog } = useDialogStore();

  const dialog = (options: DialogOptions) => {
    const id = genId();
    const newDialog: Dialog = {
      open: true,
      ...options,
      id,
      onOpenChange: open => {
        if (!open) dismiss();
      },
    };
    addDialog(newDialog);
    return {
      id,
      dismiss: () => dismiss(),
      update: (updatedProps: Partial<Dialog>) => {
        // Remove the old dialog and add an updated one
        removeDialog(id);
        addDialog({ ...newDialog, ...updatedProps });
      },
    };
  };

  const dismiss = () => {
    dismissDialog();
  };

  return {
    dialogs,
    dialog,
    dismiss,
  };
}

// Dialog component that renders the current dialog in the queue
export function DialogRenderer() {
  const { dialogs, dismiss } = useDialogQueue();
  const currentDialog = dialogs[0];

  if (!currentDialog) return null;

  const handleConfirm = () => {
    currentDialog.onConfirm?.();
    dismiss();
  };

  const handleCancel = () => {
    currentDialog.onCancel?.();
    dismiss();
  };

  return (
    <AlertDialog
      open={currentDialog.open}
      onOpenChange={currentDialog.onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{currentDialog.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {currentDialog.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {currentDialog.cancelText || "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              currentDialog.variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {currentDialog.confirmText || "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
