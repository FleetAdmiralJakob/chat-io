"use client";

import { Input } from "~/components/ui/input";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { isClerkAPIResponseError } from "@clerk/shared";
import { ChevronLeft, HardDriveUpload, MailCheck, MailX } from "lucide-react";
import { z, ZodError } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";

const SettingsPage = () => {
  const EmailValidator = z.object({
    email: z.string().email(),
  });
  const Password = z.object({
    password: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters.",
      })
      .max(20, {
        message: "Password must be at most 20 characters.",
      }),
  });
  const clerkUser = useUser();
  const [lastName, setLastName] = useState(clerkUser.user?.lastName || "");
  const [firstName, setFirstName] = useState(clerkUser.user?.firstName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPasswordErrorMessage, setCurrentPasswordErrorMessage] =
    useState("");
  const [newPasswordErrorMessage, setNewPasswordErrorMessage] = useState("");
  const [emailValue, setEmailValue] = useState(
    clerkUser.user?.emailAddresses.map((email) => email.emailAddress) || "",
  );

  useEffect(() => {
    if (clerkUser.user?.firstName) {
      setFirstName(clerkUser.user.firstName);
    }

    if (clerkUser.user?.lastName) {
      setLastName(clerkUser.user.lastName);
    }

    if (clerkUser.user?.emailAddresses.map((email) => email.emailAddress)) {
      setEmailValue(
        clerkUser.user.emailAddresses.map((email) => email.emailAddress),
      );
    }
  }, [
    clerkUser.user?.firstName,
    clerkUser.user?.lastName,
    clerkUser.user?.emailAddresses,
  ]);

  const router = useRouter();
  const [emailError, setEmailError] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailValue(e.target.value);

    try {
      EmailValidator.parse({ email: e.target.value });
      setEmailError(false);
    } catch (error) {
      setEmailError(true);
    }
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value);
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value);
  };

  const handleCurrentPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPassword(e.target.value);
    setCurrentPasswordErrorMessage("");
  };

  const handleNewPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    setNewPasswordErrorMessage("");

    try {
      Password.parse({ password: e.target.value });
      setNewPasswordErrorMessage("");
    } catch (e) {
      if (e instanceof ZodError) {
        const firstErrorMessage = e.errors[0]?.message;
        setNewPasswordErrorMessage(firstErrorMessage?.toString() || "");
      }
    }
  };

  async function checkPasswordAgainstClerkRules(
    currentPassword: string,
    newPassword: string,
  ) {
    try {
      try {
        Password.parse({ password: newPassword });
        setNewPasswordErrorMessage("");
      } catch (e) {
        if (e instanceof ZodError) {
          const firstErrorMessage = e.errors[0]?.message;
          setNewPasswordErrorMessage(firstErrorMessage?.toString() || "");
          return;
        }
      }

      await clerkUser.user?.updatePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
      });

      console.log("Password changed successfully");
    } catch (e) {
      if (isClerkAPIResponseError(e)) {
        if (e.errors.some((error) => error.code === "form_password_pwned")) {
          setNewPasswordErrorMessage(
            "Password has been found in an online data breach.",
          );
        }
        if (
          e.errors.some(
            (error) => error.code === "form_password_validation_failed",
          )
        ) {
          setCurrentPasswordErrorMessage("Invalid Current Password");
          console.log(
            e.errors.some(
              (error) => error.code === "form_password_validation_failed",
            ),
          );
        }
      }
    }
  }

  return (
    <>
      <div className="flex justify-center text-destructive-foreground lg:hidden">
        <p className="absolute top-12 text-xl font-semibold">Settings</p>
        <ChevronLeft
          className="absolute left-10 top-11 h-8 w-8"
          onClick={() => {
            router.back();
          }}
        />
      </div>
      <main className="flex h-screen flex-col items-center justify-center lg:ml-24">
        <div className="flex h-2/3 w-full flex-col items-center justify-center sm:h-1/2">
          <div className="mb-4 w-11/12 lg:w-1/3">
            <div className="relative w-full">
              <Input
                placeholder="First name"
                value={firstName}
                onChange={handleFirstNameChange}
                className="border-2 border-secondary"
              />
              {firstName != "" && firstName != clerkUser.user?.firstName ? (
                <div
                  onClick={() => {
                    clerkUser.user?.update({ firstName: firstName });
                  }}
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 transform cursor-pointer rounded-sm bg-secondary p-2 px-3 text-[100%] text-destructive-foreground"
                >
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
          <div className="mb-4 w-11/12 lg:w-1/3">
            <div className="relative w-full">
              <Input
                placeholder="Last name"
                value={lastName}
                onChange={handleLastNameChange}
                className="border-2 border-secondary"
              />
              {lastName != "" && lastName != clerkUser.user?.lastName ? (
                <div
                  onClick={() => {
                    clerkUser.user?.update({ lastName: lastName });
                  }}
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 transform cursor-pointer rounded-sm bg-secondary p-2 px-3 text-[100%] text-destructive-foreground"
                >
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
          <div className="mb-4 w-11/12 lg:w-1/3">
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
          <Dialog>
            <DialogTrigger asChild>
              <div className="mt-4 flex cursor-pointer rounded-sm border-2 border-secondary bg-primary p-2 px-3 text-[100%] text-destructive-foreground">
                <HardDriveUpload className="mr-1 h-5 w-5" />
                <p>Update Password</p>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  If you want to change your password, you can do it here.
                </DialogDescription>
              </DialogHeader>
              <div className="gap-4 py-4">
                <div className="flex-col items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Current password
                  </Label>
                  <Input
                    value={currentPassword}
                    type="password"
                    onChange={handleCurrentPassword}
                    className="col-span-3 mt-1"
                  />
                  <Label
                    htmlFor="username"
                    className="text-right text-[80%] text-accent"
                  >
                    {currentPasswordErrorMessage}
                  </Label>
                </div>
                <div className="mt-4 flex-col items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    New password
                  </Label>
                  <Input
                    value={newPassword}
                    type="password"
                    onChange={handleNewPassword}
                    className="col-span-3 mt-1"
                  />
                  <Label
                    htmlFor="username"
                    className="text-right text-[80%] text-accent"
                  >
                    {newPasswordErrorMessage}
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={() => {
                    checkPasswordAgainstClerkRules(
                      currentPassword,
                      newPassword,
                    );
                  }}
                >
                  Change
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </>
  );
};

export default SettingsPage;
