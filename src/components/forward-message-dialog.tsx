// API imports for Convex backend communication
import { api } from "#convex/_generated/api";
import { type Id } from "#convex/_generated/dataModel";
// Component and type imports
import { type UserInfos } from "~/components/message";
import Badge from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
// Utility functions
import { cn } from "~/lib/utils";
// Convex hooks for data fetching and mutations
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
// Icon components
import { LoaderCircle } from "lucide-react";
// React core imports
import React, { useState, type Dispatch, type SetStateAction } from "react";

/**
 * Props interface for the ForwardDialog component
 * @property {string} ForwardedMessageId - The ID of the message being forwarded (empty string when dialog is closed)
 * @property {Dispatch<SetStateAction<string>>} setForwardedMessageId - State setter to control which message is being forwarded
 * @property {UserInfos} userInfos - Information about the current user (username, ID, etc.)
 */
interface ForwardDialogProps {
  ForwardedMessageId: string;
  setForwardedMessageId: Dispatch<SetStateAction<string>>;
  userInfos: UserInfos;
}

/**
 * Represents a user/chat that can receive a forwarded message
 * @property {string} username - The display name of the user or chat
 * @property {string} userId - The unique identifier for the user
 * @property {Id<"privateChats">} chatId - The ID of the private chat where the message will be forwarded
 */
export interface ForwardUser {
  username: string;
  userId: string;
  chatId: Id<"privateChats">;
}

/**
 * ForwardDialog Component
 *
 * A dialog that allows users to forward messages to one or multiple chats.
 * Displays a list of all available chats (including support chat, personal notes, and private chats)
 * with checkboxes to select recipients. Handles the forwarding process with loading states.
 *
 * @param {ForwardDialogProps} props - Component props
 * @returns {JSX.Element} The forward message dialog component
 */
export const ForwardDialog = ({
  ForwardedMessageId,
  setForwardedMessageId,
  userInfos,
}: ForwardDialogProps) => {
  // State to track which chats/users have been selected to receive the forwarded message
  const [chatsToForwardTo, setChatsToForwardTo] = useState<ForwardUser[]>([]);

  // Fetch all available chats from the backend
  const chats = useQuery(api.chats.getChats);

  // Mutation hook to forward the message to selected chats
  const forwardMessage = useMutation(api.messages.forwardMessage);

  /**
   * Handles the selection/deselection of a chat to forward the message to
   * Toggles the user in the chatsToForwardTo array - adds if not present, removes if already selected
   *
   * @param {ForwardUser} user - The user/chat to toggle in the selection
   */
  const handleForward = (user: ForwardUser) => {
    // If no chats are selected yet, add this one
    if (chatsToForwardTo.length == 0) {
      setChatsToForwardTo((prev) => [...prev, user]);
    } else {
      // Check if this user is already selected
      if (
        chatsToForwardTo.some(
          (forwardObject) => forwardObject.userId === user.userId,
        )
      ) {
        // User is already selected, remove them from the list
        setChatsToForwardTo((prev) =>
          prev.filter((filteredUser) => filteredUser.userId !== user.userId),
        );
      } else {
        // User is not selected, add them to the list
        setChatsToForwardTo((prev) => [...prev, user]);
      }
    }
  };

  /**
   * Handles the submission of the forward operation
   * Sends the message to all selected chats, then resets the dialog state
   *
   * @param {ForwardUser[]} forwardObjects - Array of users/chats to forward the message to
   */
  const onForwardSubmit = async (forwardObjects: ForwardUser[]) => {
    // Set loading state while the forward operation is in progress
    setLoading(true);
    // Execute the forward mutation with the message ID and selected recipients
    await forwardMessage({ messageId: ForwardedMessageId, forwardObjects });
    // Clear the forwarded message ID (closes the dialog)
    setForwardedMessageId("");
    // Reset the selected chats
    setChatsToForwardTo([]);
    // Clear loading state
    setLoading(false);
  };

  /**
   * Closes the dialog and resets all state
   * Called when the user cancels or closes the dialog without forwarding
   */
  const closeDialog = () => {
    // Clear the forwarded message ID (closes the dialog)
    setForwardedMessageId("");
    // Reset the selected chats
    setChatsToForwardTo([]);
    // Clear any loading state
    setLoading(false);
  };

  // State to track whether a forward operation is in progress
  const [loading, setLoading] = useState(false);

  return (
    <Dialog
      // Close the dialog when the user clicks outside or presses escape
      onOpenChange={(e) => (!e ? closeDialog() : null)}
      // Dialog is open when there's a message ID to forward
      open={ForwardedMessageId !== ""}
    >
      {/* Dialog content with max width for better mobile display */}
      <DialogContent className="sm:max-w-md">
        {/* Dialog header with title and description */}
        <DialogHeader>
          <DialogTitle className="flex">
            <p className="mt-1">Forward</p>{" "}
          </DialogTitle>
          <DialogDescription>
            Select a user to forward the message to.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable container for the list of chats */}
        <div
          className={cn(
            "grid max-h-72 gap-2 overflow-auto",
            // Center the loading spinner when chats are being fetched
            chats === undefined ? "flex justify-center" : null,
          )}
        >
          {/* Show loading spinner while chats are being fetched */}
          {chats === undefined ? (
            <LoaderCircle className="mr-1.5 animate-spin justify-center p-0.5" />
          ) : (
            // Render the list of available chats
            chats?.map((chat, index) => {
              // Filter out the current user from the chat to show only other participants
              const otherUsers = chat.users.filter(
                (user) => user.username !== userInfos[0]?.username,
              );

              return (
                <div key={index}>
                  {/* Render the support chat option if this is a support chat */}
                  {chat.support ? (
                    <div
                      onClick={() =>
                        handleForward({
                          username: "Chat.io Support",
                          userId: chat._id,
                          chatId: chat._id,
                        })
                      }
                      className="bg-secondary flex cursor-pointer rounded-xl p-5"
                    >
                      {/* Checkbox shows if this chat is selected */}
                      <Checkbox
                        checked={
                          chatsToForwardTo.length > 0
                            ? chatsToForwardTo.some(
                                (forwardObject) =>
                                  forwardObject.userId === chat._id,
                              )
                            : false
                        }
                        className="mt-1 mr-3 flex"
                      />
                      {/* Support chat label with badge */}
                      <div className="flex">
                        Chat.io <Badge>Support</Badge>
                      </div>
                    </div>
                  ) : null}

                  {/* Render "My Notes" option if this is a self-chat (no other users) */}
                  {!chat.support && otherUsers.length === 0 ? (
                    <div
                      onClick={() =>
                        handleForward({
                          username: userInfos[0]!.username,
                          userId: userInfos[0]!._id,
                          chatId: chat._id,
                        })
                      }
                      className="bg-secondary flex cursor-pointer rounded-xl p-5"
                    >
                      {/* Checkbox shows if "My Notes" is selected */}
                      <Checkbox
                        checked={
                          chatsToForwardTo.length > 0
                            ? chatsToForwardTo.some(
                                (forwardObject) =>
                                  forwardObject.userId === userInfos[0]!._id,
                              )
                            : false
                        }
                        className="mt-1 mr-3 flex"
                      />
                      {/* My Notes label with badge */}
                      <div className="flex">
                        My Notes <Badge>Tool</Badge>
                      </div>
                    </div>
                  ) : null}
                  {/* Render each regular user in the chat (excluding support and self-chats) */}
                  {otherUsers.map((user, userIndex) => {
                    return (
                      <div
                        onClick={() =>
                          handleForward({
                            username: user.username,
                            userId: user._id,
                            chatId: chat._id,
                          })
                        }
                        key={userIndex}
                        className="bg-secondary flex cursor-pointer rounded-xl p-5"
                      >
                        {/* Checkbox shows if this user is selected */}
                        <Checkbox
                          checked={
                            chatsToForwardTo.length > 0
                              ? chatsToForwardTo.some(
                                  (forwardObject) =>
                                    forwardObject.userId === user._id,
                                )
                              : false
                          }
                          className="mt-1 mr-3 flex"
                        />
                        {/* Display the user's username */}
                        <p className="font-medium">{user.username}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Forward button - disabled when no chats are selected or while loading */}
        <Button
          onClick={async () => {
            await onForwardSubmit(chatsToForwardTo);
          }}
          disabled={chatsToForwardTo.length === 0 || loading}
        >
          <p>
            {/* Show "Forward" text when not loading, or loading spinner with "Processing..." when loading */}
            {!loading ? (
              "Forward"
            ) : (
              <div className="flex">
                <LoaderCircle className="mr-1.5 animate-spin p-0.5" />
                <p className="mt-0.5">Processing...</p>
              </div>
            )}
          </p>
        </Button>
      </DialogContent>
    </Dialog>
  );
};

// Export the component as the default export
export { ForwardDialog as default };
