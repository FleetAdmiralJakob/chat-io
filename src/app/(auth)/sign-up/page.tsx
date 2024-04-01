import icon from "~/assets/chatio.png";
import Image from "next/image";
import { SignUpForm } from "~/app/(auth)/sign-up/signup-form";
import Link from "next/link";

const SignInPage = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <div className="flex items-center justify-center gap-8 pb-12">
        <Image src={icon} alt="logo of Chat.io" />
        <h1 className="pr-9 text-2xl font-bold tracking-tight">
          Welcome to Chat.io
        </h1>
      </div>
      <SignUpForm />
      <span className="pt-7">
        If you already have an account you can{" "}
        <Link href="/sign-in" className="underline">
          sign-in here
        </Link>
      </span>
    </div>
  );
};

export default SignInPage;
