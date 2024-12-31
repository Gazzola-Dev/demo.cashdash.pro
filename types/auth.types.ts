import { Tables } from "@/types/database.types";

export enum AuthFormType {
  SignIn = "sign-in",
  SignUp = "sign-up",
  ForgotPassword = "forgot-password",
  ResetPassword = "reset-password",
  VerifyEmail = "verify-email",
}

export interface AuthFormState {
  type: AuthFormType;
  email?: string;
  loading?: boolean;
  success?: boolean;
  error?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface ResetPasswordCredentials {
  password: string;
  token?: string;
}

// Types for role-based authorization
export type AppRole = Tables<"user_roles">["role"];
export type AppPermission = Tables<"role_permissions">["permission"];

export interface AuthorizeOptions {
  role?: AppRole;
  permissions?: AppPermission[];
  requireAll?: boolean;
}

// Session types
export interface AuthSession {
  user: {
    id: string;
    email: string;
    role?: AppRole;
    permissions?: AppPermission[];
  };
  expires_at: number;
}

// OAuth provider types
export enum OAuthProvider {
  Google = "google",
  GitHub = "github",
  Azure = "azure",
}

export interface OAuthConfig {
  provider: OAuthProvider;
  scopes?: string[];
  redirectTo?: string;
}

// Error types
export enum AuthErrorType {
  InvalidCredentials = "invalid_credentials",
  EmailNotVerified = "email_not_verified",
  TokenExpired = "token_expired",
  UnauthorizedRole = "unauthorized_role",
  UnauthorizedPermission = "unauthorized_permission",
  InvalidToken = "invalid_token",
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: Record<string, any>;
}
