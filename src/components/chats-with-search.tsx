import { AddUserDialog } from "~/components/homepage/add-user-dialog";
import { SignOutButton } from "@clerk/nextjs";
import Chats from "~/components/homepage/chat-overview";
import { User } from "@clerk/backend";

const ChatsWithSearch = ({
  classNameChat,
  user,
}: {
  classNameChat?: string;
  user: User;
}) => {
  return (
    <div className="min-w-96 pb-24 lg:ml-24">
      <div className="relative flex h-full w-full justify-center">
        <h1 className=" pt-28 text-4xl font-bold">Chats</h1>
        <AddUserDialog classNameDialogTrigger="absolute bg-input right-16 top-16" />
      </div>
      <p className="absolute top-0">
        Current User: {user.username} <br /> <SignOutButton />
      </p>{" "}
      <br />
      <Chats classNameChat={classNameChat} />
    </div>
  );
};

export default ChatsWithSearch;
