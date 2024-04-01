import icon from "~/assets/chatio.png";
import Image from "next/image";
import { SignUpForm } from "~/app/(auth)/sign-up/signup-form";
import Link from "next/link";

const SignInPage = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <div className="top-10 flex items-center justify-center gap-8 pb-12 pt-7 ">
        <Image src={icon} className={"w-20 xl:w-32"} alt="logo of Chat.io" />
        <h1 className=" pr-9 text-xl font-bold tracking-tight sm:text-3xl">
          Welcome to Chat.io
        </h1>
      </div>
      <SignUpForm />
      <div className="bottom-3 left-0 flex w-full items-end justify-center xl:fixed">
        <span className="bottom-0 w-2/3 pt-10 pt-7 xl:w-1/5">
          If you already have an account you can{" "}
          <Link href="/sign-in" className="underline">
            sign-in here
          </Link>
        </span>
      </div>
    </div>
  );
};

export default SignInPage;
