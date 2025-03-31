import { Notification } from "@/types/notification.types";

export interface UseActionOptions {
  successNotification?: Partial<Notification> | null;
  errorNotification?: Partial<Notification> | null;
  onSuccess?: (data?: any) => void;
  onError?: (error?: string) => void;
  endPendingOnSuccess?: boolean;
}

export interface ActionResponse<T> {
  data: T | null;
  error: string | null;
}

export interface AuthActionValues {
  email: string;
  password: string;
}

export interface ForgotPasswordFormValues {
  email: string;
}

export interface ResetPasswordFormValues {
  password: string;
}
