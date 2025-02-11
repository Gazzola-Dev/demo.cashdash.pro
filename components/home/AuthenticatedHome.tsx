// components/home/AuthenticatedHome.tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUpdateProfile } from "@/hooks/profile.hooks";
import { useToastQueue } from "@/hooks/useToastQueue";
import { useIsAdmin, useSignOut } from "@/hooks/user.hooks";
import { cn } from "@/lib/utils";
import { UserWithProfile } from "@/types/user.types";
import { Check, Edit2, LogOut, Shield, Trash2 } from "lucide-react";
import { useState } from "react";

interface AuthenticatedHomeProps {
  user: UserWithProfile;
}

export function AuthenticatedHome({ user }: AuthenticatedHomeProps) {
  const isAdmin = useIsAdmin();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(
    user.profile?.display_name ?? "",
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { mutate: updateProfile } = useUpdateProfile();
  const { mutate: signOut } = useSignOut();
  const { toast } = useToastQueue();

  const handleSave = () => {
    updateProfile(
      { display_name: displayName },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast({
            title: "Profile updated successfully",
          });
        },
      },
    );
  };

  const handleDelete = () => {
    // Implementation for account deletion would go here
    toast({
      title: "Account deletion",
      description: "This feature is not yet implemented",
      variant: "destructive",
    });
    setShowDeleteDialog(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Welcome back
          </h1>
          <div className="flex items-center justify-center gap-2">
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="text-center"
                />
                <Button variant="ghost" size="icon" onClick={handleSave}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  "flex items-center text-sm font-light",
                  !displayName && "italic text-gray-700",
                )}
              >
                <button onClick={() => setIsEditing(true)} className="text-xl">
                  {displayName || "Enter your name here..."}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {isAdmin && (
            <div className="flex items-center justify-center mt-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 mr-1" />
              Admin
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Button onClick={() => signOut()} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </main>
  );
}
