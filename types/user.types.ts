import { ActionResponse } from "@/types/action.types";
import { Tables } from "@/types/database.types";
import { User } from "@supabase/supabase-js";

export interface AuthData {
  user: User | null;
}

// Base types from database
export type UserRole = Tables<"user_roles">;
type Profile = Tables<"profiles">;

// Extended types for relationships
export interface UserWithProfile extends User {
  profile: Profile;
}

export interface UserWithRole extends UserWithProfile {
  user_roles: UserRole[];
}

// Response types
export interface UserResponse extends ActionResponse<UserWithProfile> {}
export interface UserListResponse extends ActionResponse<UserWithProfile[]> {}
export interface UserRoleResponse extends ActionResponse<UserRole> {}

// User creation/update types
export interface UserInput {
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
}

export interface UserProfileInput extends Partial<Profile> {
  id: string;
}

export interface UserRoleInput extends Omit<UserRole, "id"> {
  id?: string;
}

// User preferences
export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    mentions: boolean;
    taskUpdates: boolean;
  };
  theme: {
    mode: "light" | "dark" | "system";
    accentColor: string;
  };
  display: {
    compactView: boolean;
    showAvatars: boolean;
  };
}
