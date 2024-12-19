import { usePrevious } from "~/lib/hooks";
import { cn } from "~/lib/utils";
import type { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Message, UserInfos } from "./message";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export const ReactionHandler = (props: {
  message: Message;
  selectedMessageId: Id<"messages"> | null;
  userInfos: UserInfos;
  side: "left" | "right";
}) => {
  const message = props.message;
  const selectedMessageId = props.selectedMessageId;
  const userInfos = props.userInfos;

  // Can't be a ref because it needs to be passed to a child component as a prop
  const [isFirstMount, setIsFirstMount] = useState(true);

  // Set isFirstMount to false AFTER the first render
  useEffect(() => {
    setIsFirstMount(false);
  }, []);

  return (
    message.type === "message" &&
    message.reactions &&
    message.reactions.length > 0 && (
      <Popover>
        <PopoverTrigger
          className={cn(
            "absolute flex -translate-x-[0%] select-none items-center justify-center gap-1 rounded-full bg-secondary px-1 lg:select-auto",
            { "z-50": message._id === selectedMessageId },
            props.side === "left" ? "bottom-0 left-0" : "bottom-4 right-0",
          )}
        >
          <ReactionQuickView
            reactions={message.reactions}
            isFirstMount={isFirstMount}
          />
        </PopoverTrigger>
        <PopoverContent>
          <ReactionDetails
            reactions={message.reactions}
            userInfos={userInfos}
          />
        </PopoverContent>
      </Popover>
    )
  );
};

// Component that shows a compact view of message reactions, displaying emojis and their counts
const ReactionQuickView = ({
  reactions,
  isFirstMount,
}: {
  reactions: Doc<"reactions">[]; // Array of reaction documents from the database
  isFirstMount: boolean; // Boolean that is true on first render, false on subsequent renders
}) => {
  // Hook that stores previous reactions to compare for animations
  // Maps reactions to just emoji strings for comparison
  const prevReactions = usePrevious(reactions.map((r) => r.emoji));

  // Count how many times each emoji appears in reactions
  // Creates an object like: { "👍": 2, "❤️": 1 }
  const currentReactionCounts = reactions.reduce(
    (acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Render each emoji and its count with animations
  return Object.entries(currentReactionCounts).map(([emoji, count]) => {
    // Determine if this emoji reaction is new (wasn't in previous reactions)
    const isNew = !prevReactions?.includes(emoji);

    return (
      // motion.div enables animations from framer-motion library
      <motion.div
        key={emoji}
        // Animation when reaction is new: slides up and fades in
        initial={
          !isFirstMount ? (isNew ? { y: -20, opacity: 0 } : false) : false
        }
        animate={{ y: 0, opacity: 1 }}
        // Spring animation configuration for smooth, bouncy feel
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className="flex items-center justify-center rounded-full bg-primary/20 text-sm"
      >
        <span className="flex aspect-square h-6 items-center justify-center pt-0.5">
          {emoji}
        </span>
        {/* Show count if more than one reaction */}
        {count > 1 && (
          <span className="pl-1 text-xs text-secondary-foreground">
            {count}
          </span>
        )}
      </motion.div>
    );
  });
};

// Component that shows detailed view of reactions, including who reacted with what
const ReactionDetails = ({
  reactions,
  userInfos, // Tuple containing current user data and other chat participants' data
}: {
  reactions: Doc<"reactions">[];
  userInfos: [
    FunctionReturnType<typeof api.users.getUserData> | undefined,
    (
      | undefined
      | NonNullable<
          FunctionReturnType<typeof api.chats.getChatInfoFromId>
        >["otherUser"]
    ),
  ];
}) => {
  // Group reactions by emoji
  // Creates object like: { "👍": [reaction1, reaction2], "❤️": [reaction3] }
  const reactionsByEmoji = reactions.reduce(
    (acc, reaction) => {
      const emojiArray = acc[reaction.emoji] ?? [];
      emojiArray.push(reaction);
      acc[reaction.emoji] = emojiArray;
      return acc;
    },
    {} as Record<string, typeof reactions>,
  );

  return (
    <div className="flex flex-col gap-2 p-2">
      {Object.entries(reactionsByEmoji).map(([emoji, reactions]) => (
        <div key={emoji}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            <div className="text-sm">
              {/* Create comma-separated list of usernames who used this emoji */}
              {reactions
                .map((reaction) => {
                  // Find user info either from current user or other chat participants
                  const user =
                    userInfos[0]?._id === reaction.userId
                      ? userInfos[0]
                      : Array.isArray(userInfos[1])
                        ? userInfos[1].find((u) => u._id === reaction.userId)
                        : userInfos[1];
                  return user?.username;
                })
                .join(", ")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
