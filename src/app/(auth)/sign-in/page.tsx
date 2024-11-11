import { SignInForm } from "~/app/(auth)/sign-in/signin-form";
import icon from "~/assets/chatio.png";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-static";

const SignInPage = () => {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center">
      <div className="mt-10 flex w-4/5 items-center justify-center gap-8 pb-4 xl:mt-0">
        <Image src={icon} className={"w-20 xl:w-24"} alt="logo of Chat.io" />
        <h1 className="pr-9 text-xl font-bold tracking-tight sm:text-3xl">
          Welcome back to Chat.io
        </h1>
      </div>
      <SignInForm />
      <div className="bottom-3 left-0 flex w-full items-end justify-center pb-7 text-center">
        <span className="flex w-3/4 items-center justify-center gap-8 pt-7">
          <div>
            If you don&#39;t have an account you can{" "}
            <Link href="/sign-up" className="underline">
              sign-up here
            </Link>
          </div>
        </span>
      </div>
    </main>
  );
};

export default SignInPage;
