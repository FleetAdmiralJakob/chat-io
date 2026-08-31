"use client";

import { useMutation } from "convex/react";
import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "#convex/_generated/dataModel";
import {
  archiveMessage,
  unarchiveMessage,
} from "#convex/issue1096MessageArchive";
import { isMyNotesChat } from "~/lib/issue1096MyNotesChat";

type MessageArchiveMenuItemProps = {
  messageId: Id<"messages">;
  chat: unknown;
  archived?: boolean;
  onArchivedChange?: (archived: boolean) => void;
};

export function MessageArchiveMenuItem({
  messageId,
  chat,
  archived = false,
  onArchivedChange,
}: MessageArchiveMenuItemProps) {
  const archiveMessageMutation = useMutation(archiveMessage);
  const unarchiveMessageMutation = useMutation(unarchiveMessage);

  if (!isMyNotesChat(chat)) {
    return null;
  }

  const onClick = async () => {
    try {
      if (archived) {
        await unarchiveMessageMutation({ messageId });
        toast.success("Message unarchived");
        onArchivedChange?.(false);
      } else {
        await archiveMessageMutation({ messageId });
        toast.success("Message archived");
        onArchivedChange?.(true);
      }
    } catch {
      toast.error("Could not update message archive state");
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/10"
    >
      {archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
      <span>{archived ? "Unarchive" : "Archive"}</span>
    </button>
  );
}
