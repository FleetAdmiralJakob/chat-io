import icon from "~/assets/icon-614x599.png";
import Image from "next/image";

const SignInPage = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <div className="absolute top-1/4 flex items-center gap-8">
        <Image src={icon} alt="logo of Chat.io" />
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome to Chat.io
        </h1>
      </div>
    </div>
  );
};

export default SignInPage;
