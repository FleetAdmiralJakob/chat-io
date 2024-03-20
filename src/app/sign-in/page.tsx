import icon from "~/assets/icon-614x599.png";
import Image from "next/image";
import { SignInForm } from "~/app/sign-in/signin-form";

const SignInPage = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <div className="flex items-center gap-8 pb-12">
        <Image src={icon} alt="logo of Chat.io" />
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome to Chat.io
        </h1>
      </div>
      <SignInForm />
    </div>
  );
};

export default SignInPage;
