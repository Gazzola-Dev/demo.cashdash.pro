// From action.types.ts
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


// From auth.types.ts
export enum AuthFormType {
  SignIn = "sign-in",
  SignUp = "sign-up",
  ForgotPassword = "forgot-password",
  ResetPassword = "reset-password",
}


// From db.types.ts
export interface HookOptions<T, K = { id: string }> {
  updateData?: Partial<T> & K;
  errorMessage?: string;
  successMessage?: string;
  initialData?: T | null;
}


// From http.types.ts
export enum HttpStatusCode {
  Ok = 200,
  MovedPermanently = 301,
  MovedTemporarily = 302,
  SeeOther = 303,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  InternalServerError = 500,
}


// From notification.types.ts
export enum Notifications {
  SignInSuccess = "Sign in successful!",
  SignUpSuccess = "Sign up successful!",
  SignOutSuccess = "Sign out successful!",
  Success = "Success!",
  Error = "Error!",
  ResetPasswordSuccess = "Password reset!",
  ForgotPasswordSuccess = "Password reset link sent!",
  GetSessionError = "Error getting session.",
  GetUserError = "Error getting user.",
  AccountVerified = "Account verified!",
  Welcome = "Welcome to your AI, Quest.",
}

export interface Notification {
  message: string;
  style?: NotificationStyle;
  variant?: NotificationVariant;
  position?: NotificationPosition;
  duration?: number;
}

export enum NotificationStyle {
  Success = "success",
  Error = "error",
  Warning = "warning",
  Info = "info",
}

export enum NotificationVariant {
  Toast = "toast",
  Modal = "modal",
}

export enum NotificationPosition {
  TopRight = "top-right",
  TopLeft = "top-left",
  BottomRight = "bottom-right",
  BottomLeft = "bottom-left",
  TopCenter = "top-center",
  BottomCenter = "bottom-center",
}


// From session.types.ts
export enum GlobalRole {
  SuperAdmin = "super-admin",
}


