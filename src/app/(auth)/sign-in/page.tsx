import icon from "~/assets/chatio.png";
import Image from "next/image";
import { SignInForm } from "~/app/(auth)/sign-in/signin-form";
import Link from "next/link";

const SignInPage = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <div className="flex items-center justify-center gap-8 pb-12">
        <Image src={icon} width={60} height={60} alt="logo of Chat.io" />
        <h1 className="pr-9 text-2xl font-bold tracking-tight">
          Welcome back to Chat.io
        </h1>
      </div>
      <SignInForm />
      <span className="pt-7">
        If you not already have an account you can{" "}
        <Link href="/sign-up" className="underline">
          sign-up here
        </Link>
      </span>
    </div>
  );
};

export default SignInPage;
