"use client";

import { Input } from "~/components/ui/input";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { HardDriveUpload, MailCheck, MailX } from "lucide-react";
import { z } from "zod";

const SettingsPage = () => {
  const EmailValidator = z.object({
    email: z.string().email(),
  });
  const clerkUser = useUser();
  const [lastName, setLastName] = useState(clerkUser.user?.lastName || "");
  const [firstName, setFirstName] = useState(clerkUser.user?.firstName || "");
  useEffect(() => {
    if (clerkUser.user?.firstName) {
      setFirstName(clerkUser.user.firstName);
    }

    if (clerkUser.user?.lastName) {
      setLastName(clerkUser.user.lastName);
    }
  }, [clerkUser.user?.firstName, clerkUser.user?.lastName]);

  const [emailValue, setEmailValue] = useState("");
  const [emailError, setEmailError] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailValue(e.target.value);

    try {
      EmailValidator.parse({ email: e.target.value });
      console.log("Email is valid", e.target.value);
      setEmailError(false);
    } catch (error) {
      console.log("Invalid email:", e.target.value, error);
      setEmailError(true);
    }
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value);
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value);
  };

  return (
    <>
      <div className="flex h-screen flex-col items-center justify-center lg:ml-24">
        <div className="flex h-2/3 w-full flex-col items-center justify-around lg:h-2/5">
          <div className="w-11/12 lg:w-1/3">
            <div className="relative w-full">
              <Input
                placeholder="First name"
                value={firstName}
                onChange={handleFirstNameChange}
                className="border-2 border-secondary"
              />
              {firstName != "" && firstName != clerkUser.user?.firstName ? (
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 transform cursor-pointer rounded-sm bg-secondary p-2 px-3 text-[100%] text-destructive-foreground">
                  <HardDriveUpload className="mr-1 h-5 w-5" />
                  <p>Update</p>
                </div>
              ) : (
                ""
              )}
            </div>
            <p className="ml-2 mt-0.5 text-[85%] text-secondary-foreground">
              First name
            </p>
          </div>
          <div className="w-11/12 lg:w-1/3">
            <div className="relative w-full">
              <Input
                placeholder="Last name"
                value={lastName}
                onChange={handleLastNameChange}
                className="border-2 border-secondary"
              />
              {lastName != "" && lastName != clerkUser.user?.lastName ? (
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 transform cursor-pointer rounded-sm bg-secondary p-2 px-3 text-[100%] text-destructive-foreground">
                  <HardDriveUpload className="mr-1 h-5 w-5" />
                  <p>Update</p>
                </div>
              ) : (
                ""
              )}
            </div>
            <p className="ml-2 mt-0.5 text-[85%] text-secondary-foreground">
              Last name
            </p>
          </div>
          <div className="w-11/12 lg:w-1/3">
            <div className="relative w-full">
              <Input
                value={emailValue}
                onChange={handleEmailChange}
                placeholder="Email"
                className="w-full border-2 border-secondary"
              />
              {emailValue != "" ? (
                !emailError ? (
                  <MailCheck
                    className="absolute right-3 top-1/2 -translate-y-1/2 transform"
                    color="#3DC726"
                  />
                ) : (
                  <MailX className="absolute right-3 top-1/2 -translate-y-1/2 transform text-accent" />
                )
              ) : (
                ""
              )}
            </div>
            <p className="ml-2 mt-0.5 text-[85%] text-secondary-foreground">
              If you forgott your password we can send you a Email
            </p>
          </div>
          <div className="w-11/12 lg:w-1/3">
            <Input
              placeholder="Password"
              className="border-2 border-secondary"
            />
            <p className="ml-2 mt-0.5 text-[85%] text-secondary-foreground">
              Password
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
