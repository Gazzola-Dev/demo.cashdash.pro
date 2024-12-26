// attachment.hooks.ts
"use client";

import {
  deleteAttachmentAction,
  getAttachmentUrlAction,
  listAttachmentsAction,
  uploadAttachmentAction,
} from "@/actions/attachment.actions";
import { Tables, TablesInsert } from "@/types/database.types";
import { HookOptions } from "@/types/db.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastQueue } from "./useToastQueue";

type Attachment = Tables<"attachments">;

enum SuccessMessages {
  UPLOAD = "File uploaded successfully",
  DELETE = "File deleted successfully",
}

// List attachments hook
export const useListAttachments = (contentType: string, contentId: string) => {
  return useQuery({
    queryKey: ["attachments", contentType, contentId],
    queryFn: async () => {
      const { data } = await listAttachmentsAction(contentType, contentId);
      return data || [];
    },
  });
};

// Get attachment URL hook
export const useGetAttachmentUrl = (storagePath: string) => {
  return useQuery({
    queryKey: ["attachment-url", storagePath],
    queryFn: async () => {
      const { data } = await getAttachmentUrlAction(storagePath);
      return data;
    },
    // Short staleTime since URLs expire
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Upload attachment hook
export const useUploadAttachment = ({
  errorMessage,
  successMessage,
}: HookOptions<Attachment> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async ({
      file,
      attachment,
    }: {
      file: File;
      attachment: TablesInsert<"attachments">;
    }) => {
      const { data } = await uploadAttachmentAction(file, attachment);
      return data;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ["attachments", data?.content_type, data?.content_id],
      });
      toast({
        title: successMessage || SuccessMessages.UPLOAD,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to upload file",
      });
    },
  });
};

// Delete attachment hook
export const useDeleteAttachment = ({
  errorMessage,
  successMessage,
}: HookOptions<Attachment> = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToastQueue();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const { data } = await deleteAttachmentAction(attachmentId);
      return data;
    },
    onSuccess: (_, attachmentId) => {
      // Invalidate all attachment queries since we don't have content type/id in context
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      toast({
        title: successMessage || SuccessMessages.DELETE,
      });
    },
    onError: (error: Error) => {
      toast({
        title: errorMessage || error.message,
        description: "Failed to delete file",
      });
    },
  });
};
