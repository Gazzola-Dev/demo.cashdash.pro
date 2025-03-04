import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/ui/sidebar";
import { useUpdateProfile } from "@/hooks/app.hooks";
import { useToast } from "@/hooks/use-toast";
import useAppData from "@/hooks/useAppData";
import { capitalizeFirstLetter } from "@/lib/string.util";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import { useEffect, useState } from "react";

const ProfileFormSmall = () => {
  const { profile } = useAppData();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile?.display_name || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { open } = useSidebar();
  const { updateProfile, isPending } = useUpdateProfile();

  // Update editedName when profile changes
  useEffect(() => {
    setEditedName(profile?.display_name || "");
  }, [profile?.display_name]);

  const handleSave = () => {
    if (editedName.trim() !== profile?.display_name) {
      updateProfile({ display_name: editedName.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSave();
    } else if (event.key === "Escape") {
      setEditedName(profile?.display_name || "");
      setIsEditing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      console.log("Updating avatar with file:", file);
      setIsDialogOpen(false);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      console.log("Updating avatar with file:", file);
      setIsDialogOpen(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md",
        open ? "p-2 pt-2" : "",
      )}
    >
      <Avatar
        className="size-8 rounded-lg cursor-default select-none"
        onClick={() => profile && setIsDialogOpen(true)}
      >
        <AvatarImage
          src={profile?.avatar_url ?? ""}
          alt={profile?.display_name ?? "User"}
        />
        <AvatarFallback className="rounded-lg bg-gray-200 dark:bg-gray-700 dark:text-gray-100">
          {capitalizeFirstLetter(
            profile?.display_name?.slice(0, 2) ??
              profile?.email?.slice(0, 2) ??
              "?",
          )}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={editedName}
            onChange={e => setEditedName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-8"
            autoFocus
            disabled={isPending}
          />
        ) : (
          <button
            onClick={() => profile && setIsEditing(true)}
            className="text-sm font-medium truncate w-full text-left cursor-text"
          >
            {profile?.display_name ||
              profile?.email?.split("@")[0] ||
              "Sign in to get started"}
          </button>
        )}
      </div>

      <Dialog open={false} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update profile picture</DialogTitle>
          </DialogHeader>
          <div
            className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 gap-4"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Drag and drop an image here, or click to select a file
            </p>
            <Input
              type="file"
              accept="image/*"
              className="max-w-xs"
              onChange={handleFileSelect}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileFormSmall;
