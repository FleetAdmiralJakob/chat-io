import ChatWithSearch from "~/components/chats-with-search";
import { NotificationPermissionRequest } from "~/components/notification-permission-request";

export default function ChatOverwiewPage() {
  return (
    <main>
      <NotificationPermissionRequest />
      <ChatWithSearch />
    </main>
  );
}
