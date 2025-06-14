import { SignUpForm } from "~/app/(auth)/sign-up/signup-form";
import icon from "~/assets/chatio.png";
import Image from "next/image";
import Link from "next/link";

const SignInPage = () => {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-10">
      <div className="mt-10 flex w-4/5 items-center justify-center gap-8 pb-4 xl:mt-0">
        <Image
          src={icon}
          className={"w-10 rounded-sm xl:w-14 xl:rounded-xl"}
          alt="logo of Chat.io"
        />
        <h1 className="pr-9 text-xl font-bold tracking-tight sm:text-3xl">
          Welcome to Chat.io
        </h1>
      </div>
      <SignUpForm />
      <div className="bottom-3 left-0 flex w-full items-end justify-center pb-7 text-center">
        <span className="flex w-3/4 items-center justify-center gap-8 pt-7">
          <div>
            If you already have an account you can{" "}
            <Link href="/sign-in" className="underline">
              sign-in here
            </Link>
          </div>
        </span>
      </div>
    </main>
  );
};

export default SignInPage;
