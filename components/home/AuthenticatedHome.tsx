import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToastQueue } from "@/hooks/useToastQueue";
import { redactEmail } from "@/lib/string.util";
import { cn } from "@/lib/utils";
import { useAppData } from "@/stores/app.store";
import { User } from "@supabase/supabase-js";
import { Check, Edit2, LogOut, Shield } from "lucide-react";
import { useState } from "react";

export function AuthenticatedHome({ user }: { user: User }) {
  const { profile: profileData, profile } = useAppData();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToastQueue();

  const handleSave = () => {
    setIsEditing(false);
    if (displayName === profile?.display_name) return;
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
                  "flex items-center text-sm pl-3",
                  !displayName && "italic text-gray-700",
                )}
              >
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-base"
                >
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
          <p className="text-muted-foreground">
            {profile?.email ? (
              redactEmail(profile?.email)
            ) : (
              <span className="italic text-sm">Email not found</span>
            )}
          </p>
          {
            <div className="flex items-center justify-center mt-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 mr-1" />
              Admin
            </div>
          }
        </div>

        <div className="space-y-4">
          <Button onClick={() => {}} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>

          {/* <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
          </Dialog> */}
        </div>
      </div>
    </main>
  );
}
