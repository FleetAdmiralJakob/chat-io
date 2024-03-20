import { Button } from "~/components/ui/button";
import icon from "~/assets/icon-614x599.png";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-foreground">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <Image src={icon} alt="logo of Chat.io" />
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-[5rem]">
          Chat.io
        </h1>
        <Link href="/sign-in">
          <Button>Get Started</Button>
        </Link>
      </div>
    </main>
  );
}
