import {Button} from "~/components/ui/button";
import icon from "~/assets/icon-614x599.png";
import Image from 'next/image';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <Image src={icon} alt="logo of Chat.io"/>
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-[5rem]">
            Chat.io
        </h1>
          <Button>Get Started</Button>
      </div>
    </main>
  );
}
