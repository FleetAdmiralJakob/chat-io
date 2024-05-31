import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Ban } from "lucide-react";
import { FunctionReturnType } from "convex/server";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

export const Message = ({
  message,
}: {
  message: FunctionReturnType<typeof api.messages.getMessages>[number];
}) => {
  const clerkUser = useUser();

  const deleteMessage = useMutation(api.messages.deleteMessage);

  const { ref, inView } = useInView({
    threshold: 0.9,
  });

  useEffect(() => {
    if (inView) {
      // Convex Mutation
    }
  }, [inView, message._id]);

  return (
    <>
      <div className="flex" ref={ref}>
        {message.from.username == clerkUser.user?.username ? (
          <div className="my-1 mr-4 flex w-full flex-col items-end">
            <div className="max-w-[66.6667%] break-words rounded-sm bg-accent p-3">
              {message.deleted ? (
                <div className="flex font-medium">
                  <Ban />
                  <p className="ml-2.5">This message was deleted</p>
                </div>
              ) : (
                message.content
              )}
            </div>
            <div className="mr-2 text-[75%] font-bold text-secondary-foreground">
              Read
            </div>
            {!message.deleted ? (
              <button
                onMouseDown={() => {
                  deleteMessage({ messageId: message._id });
                }}
              >
                Delete
              </button>
            ) : null}
          </div>
        ) : (
          <div className="my-1 ml-4 flex w-full justify-start">
            <div className="max-w-[66.6667%] rounded-sm bg-secondary p-3">
              {message.deleted ? (
                <div className="flex font-medium">
                  <Ban />
                  <p className="ml-2.5">This message was deleted</p>
                </div>
              ) : (
                message.content
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
