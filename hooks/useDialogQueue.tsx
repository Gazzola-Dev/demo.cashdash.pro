// hooks/useDialogQueue.tsx
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const DIALOG_QUERY_KEY = ["dialogs"];

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

// Initial dialog state
const initialDialogState: Dialog[] = [];

// Generate unique ID for each dialog
function genId() {
  return `${Date.now()}-${Math.random()}`;
}

// Custom hook for managing dialog queue
export function useDialogQueue() {
  const queryClient = useQueryClient();

  // Query to get current dialogs
  const { data: dialogs = initialDialogState } = useQuery({
    queryKey: DIALOG_QUERY_KEY,
    initialData: initialDialogState,
    staleTime: Infinity,
  });

  // Mutation to add dialog
  const addDialogMutation = useMutation({
    mutationFn: (dialog: Dialog) => {
      return Promise.resolve([...dialogs, dialog]);
    },
    onMutate: newDialog => {
      queryClient.setQueryData(
        DIALOG_QUERY_KEY,
        (oldDialogs: Dialog[] | undefined) => {
          return [newDialog, ...(oldDialogs || [])];
        },
      );
    },
  });

  // Mutation to dismiss dialog
  const dismissDialogMutation = useMutation({
    mutationFn: () => {
      return Promise.resolve(
        dialogs.map((d, index) => (index === 0 ? { ...d, open: false } : d)),
      );
    },
    onMutate: () => {
      queryClient.setQueryData(
        DIALOG_QUERY_KEY,
        (oldDialogs: Dialog[] | undefined) =>
          oldDialogs?.map((d, index) =>
            index === 0 ? { ...d, open: false } : d,
          ),
      );
    },
  });

  // Mutation to remove dialog
  const removeDialogMutation = useMutation({
    mutationFn: (dialogId: string) => {
      return Promise.resolve(dialogs.filter(d => d.id !== dialogId));
    },
    onMutate: dialogId => {
      queryClient.setQueryData(
        DIALOG_QUERY_KEY,
        (oldDialogs: Dialog[] | undefined) =>
          oldDialogs?.filter(d => d.id !== dialogId),
      );
    },
  });

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
    addDialogMutation.mutate(newDialog);
    return {
      id,
      dismiss: () => dismiss(),
      update: (updatedProps: Partial<Dialog>) => {
        queryClient.setQueryData(
          DIALOG_QUERY_KEY,
          (oldDialogs: Dialog[] | undefined) =>
            oldDialogs?.map(dialog =>
              dialog.id === id ? { ...dialog, ...updatedProps } : dialog,
            ),
        );
      },
    };
  };

  const dismiss = () => {
    dismissDialogMutation.mutate();
  };

  return {
    dialogs,
    dialog,
    dismiss,
  };
}

// Dialog component that renders the current dialog in the queue
export function DialogRenderer() {
  const { dialogs = [], dismiss } = useDialogQueue();
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
