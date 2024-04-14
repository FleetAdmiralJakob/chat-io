import icon from "~/assets/chatio.png";
import Image from "next/image";
import { SignInForm } from "~/app/(auth)/sign-in/signin-form";
import Link from "next/link";

const SignInPage = () => {
  return (
    <>
      <div className="relative flex min-h-screen flex-col items-center justify-center">
        <div className="flex w-4/5 items-center justify-center gap-8 pb-16">
          <Image src={icon} className={"w-20 xl:w-24"} alt="logo of Chat.io" />
          <h1 className=" pr-9 text-xl font-bold tracking-tight sm:text-3xl">
            Welcome back to Chat.io
          </h1>
        </div>
        <SignInForm />
      </div>
      <div className="bottom-3 left-0 flex w-full items-end justify-center xl:fixed ">
        <span className="mb-7 flex w-3/4 items-center justify-center gap-8">
          <div>
            If you not have an account you can{" "}
            <Link href="/sign-up" className="underline">
              sign-up here
            </Link>
          </div>
        </span>
      </div>
    </>
  );
};

export default SignInPage;
