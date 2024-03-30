import { currentUser, UserButton } from "@clerk/nextjs";
import PublicHomepage from "~/app/public-homepage";

export default async function HomePage() {
  const user = await currentUser();
  if (user) {
    return (
      <div>
        <h1>Welcome back, {user.username}</h1>
        <UserButton />
      </div>
    );
  }

  return <PublicHomepage />;
}
