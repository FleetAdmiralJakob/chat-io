import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Ban, CopyCheck, Forward, Info, Trash2 } from "lucide-react";
import { FunctionReturnType } from "convex/server";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useFloating } from "@floating-ui/react";
import { Toaster } from "~/components/ui/sonner";
import { toast } from "sonner";

dayjs.extend(relativeTime);

export const Message = ({
  message,
  selectedMessageId,
  setSelectedMessageId,
}: {
  message: FunctionReturnType<typeof api.messages.getMessages>[number];
  selectedMessageId: string | null;
  setSelectedMessageId: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const clerkUser = useUser();

  const deleteMessage = useMutation(api.messages.deleteMessage);

  const { ref, inView } = useInView({
    threshold: 0.9,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent;
      if (/android/i.test(userAgent)) {
        setIsMobile(true);
      } else if (/iPad|iPhone|iPod/.test(userAgent)) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    checkIfMobile();
  }, []);

  const [messageOwner, setMessageOwner] = useState<boolean | null>(null);
  const { refs, floatingStyles } = useFloating({
    placement: messageOwner ? "bottom-end" : "bottom-start",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const markRead = useMutation(api.messages.markMessageRead);

  useEffect(() => {
    if (inView) {
      markRead({ messageId: message._id });
    }
  }, [inView, message._id]);

  return (
    <>
      <Toaster />

      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(!isModalOpen)}
          className="fixed inset-0 z-10 bg-black opacity-75"
        ></div>
      )}
      <div className="flex" ref={ref}>
        {message.from.username == clerkUser.user?.username ? (
          <div
            ref={refs.setReference}
            className="my-1 mr-4 flex w-full flex-col items-end"
          >
            <div
              onContextMenu={(e) => {
                e.preventDefault();
                if (message.deleted) return;
                setIsModalOpen(!isModalOpen);
                setSelectedMessageId(message._id);
                setMessageOwner(true);
              }}
              onClick={() => {
                if (!isMobile) return;
                if (message.deleted) return;
                setIsModalOpen(!isModalOpen);
                setSelectedMessageId(message._id);
                setMessageOwner(true);
              }}
              className={cn(
                "max-w-[66.6667%] cursor-default break-words rounded-sm bg-accent p-3",
                {
                  "sticky z-50 opacity-100": message._id === selectedMessageId,
                },
              )}
            >
              {message.deleted ? (
                <div className="flex font-medium">
                  <Ban />
                  <p className="ml-2.5">This message was deleted</p>
                </div>
              ) : (
                <div>{message.content}</div>
              )}
            </div>
            <div className="mr-2 text-[75%] font-bold text-secondary-foreground">
              {!message.deleted
                ? message.readBy
                  ? message.readBy.map((user) =>
                      user.username != clerkUser.user?.username
                        ? "Read"
                        : message.readBy.length == 1
                          ? "Sent"
                          : null,
                    )
                  : null
                : null}
            </div>
            {message._id == selectedMessageId && isModalOpen ? (
              <div
                ref={refs.setFloating}
                style={floatingStyles}
                className="z-50 rounded-sm border-2 border-secondary-foreground opacity-100"
              >
                <div className="rounded-sm bg-secondary">
                  <div
                    className="flex cursor-pointer p-2"
                    onClick={() => {
                      navigator.clipboard.writeText(message.content);
                      setIsModalOpen(!isModalOpen);
                      toast.success("Copied to clipboard");
                    }}
                  >
                    <CopyCheck />
                    <p className="ml-1">Copy</p>
                  </div>
                  <div className="flex cursor-pointer border-y-2 border-secondary-foreground p-2 pr-8">
                    <Forward />
                    <p className="ml-1">Answer</p>
                  </div>
                  <div className="flex p-2 text-accent">
                    <Trash2 />
                    <button
                      onMouseDown={() => {
                        deleteMessage({
                          messageId: message._id,
                        });
                        setIsModalOpen(!isModalOpen);
                      }}
                      className="ml-1"
                    >
                      Delete
                    </button>
                  </div>{" "}
                  <div className="flex border-t-2 border-secondary-foreground p-2 pr-8 text-secondary-foreground">
                    <Info />
                    <p className="ml-1">
                      Sent at {dayjs(message._creationTime).hour()}:
                      {dayjs(message._creationTime).minute() < 10
                        ? "0" + dayjs(message._creationTime).minute()
                        : dayjs(message._creationTime).minute()}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="my-1 ml-4 flex w-full justify-start">
            <div
              ref={refs.setReference}
              onContextMenu={(e) => {
                e.preventDefault();
                if (message.deleted) return;
                setIsModalOpen(!isModalOpen);
                setSelectedMessageId(message._id);
                setMessageOwner(false);
              }}
              onClick={() => {
                if (!isMobile) return;
                if (message.deleted) return;
                setIsModalOpen(!isModalOpen);
                setSelectedMessageId(message._id);
                setMessageOwner(false);
              }}
              className={cn(
                "max-w-[66.6667%] cursor-default break-words rounded-sm bg-secondary p-3",
                {
                  "sticky z-50 opacity-100": message._id == selectedMessageId,
                },
              )}
            >
              {message.deleted ? (
                <div className="flex font-medium">
                  <Ban />
                  <p className="ml-2.5">This message was deleted</p>
                </div>
              ) : (
                message.content
              )}
            </div>
            {message._id == selectedMessageId && isModalOpen ? (
              <div
                ref={refs.setFloating}
                style={floatingStyles}
                className="z-50 mt-4 rounded-sm border-2 border-secondary-foreground opacity-100"
              >
                <div className="rounded-sm bg-secondary">
                  <div
                    onClick={() => {
                      navigator.clipboard.writeText(message.content);
                      setIsModalOpen(!isModalOpen);
                      toast.success("Copied to clipboard");
                    }}
                    className="flex cursor-pointer p-2"
                  >
                    <CopyCheck />
                    <p className="ml-1">Copy</p>
                  </div>
                  <div className="flex cursor-pointer border-y-2 border-secondary-foreground p-2 pr-8">
                    <Forward />
                    <p className="ml-1">Answer</p>
                  </div>
                  <div className="flex p-2 pr-8 text-secondary-foreground">
                    <Info />
                    <p className="ml-1">
                      Sent at {dayjs(message._creationTime).hour()}:
                      {dayjs(message._creationTime).minute() < 10
                        ? "0" + dayjs(message._creationTime).minute()
                        : dayjs(message._creationTime).minute()}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
};
