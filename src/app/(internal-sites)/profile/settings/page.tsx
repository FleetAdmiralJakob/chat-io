"use client";

import { Input } from "~/components/ui/input";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { isClerkAPIResponseError } from "@clerk/shared";
import {
  ChevronLeft,
  CircleCheck,
  CircleX,
  HardDriveUpload,
  MailCheck,
  MailX,
} from "lucide-react";
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
import { Toaster } from "~/components/ui/sonner";
import { toast } from "sonner";
import { FormSchemaUserUpdate, formSchemaUserUpdate } from "~/lib/validators";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const SettingValidator = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters.",
    })
    .max(20, {
      message: "Password must be at most 20 characters.",
    }),
  firstName: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(20, {
      message: "Name must be at most 20 characters.",
    }),
  lastName: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(20, {
      message: "Name must be at most 20 characters.",
    }),
});

const signUpResponseSchema = z.object({
  message: z.string(),
  statusText: z.string().optional(),
});

const SettingsPage = () => {
  const clerkUser = useUser();
  const [lastName, setLastName] = useState(clerkUser.user?.lastName || "");
  const [firstName, setFirstName] = useState(clerkUser.user?.firstName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPasswordErrorMessage, setCurrentPasswordErrorMessage] =
    useState("");
  const [newPasswordErrorMessage, setNewPasswordErrorMessage] = useState("");
  const [emailValue, setEmailValue] = useState(
    clerkUser.user?.primaryEmailAddress?.emailAddress || "",
  );
  const [emailError, setEmailError] = useState(false);
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");

  const updateConvexUserData = useMutation(api.users.updateUserData);

  async function test() {
    const valuesObject: z.infer<typeof formSchemaUserUpdate> = {
      email: emailValue,
      firstName: firstName,
      lastName: lastName,
    };

    const response = await fetch("/api/sign-up", {
      method: "OPTIONS",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(valuesObject),
    });

    const responseBody = await response.text(); // Get the response body as text
    if (!responseBody) {
      return;
    }

    const parsedResponseBody = signUpResponseSchema.safeParse(
      JSON.parse(responseBody),
    );

    if (parsedResponseBody.data?.message) {
      const parsedJson = JSON.parse(parsedResponseBody.data.message) as
        | any[]
        | { [key: string]: any };

      parsedJson.forEach((error: any) => {
        if (error.path[0] == "email") {
          setEmailError(true);
        }
        if (error.path[0] == "firstName") {
          setFirstNameError(error.message);
        }
        if (error.path[0] == "lastName") {
          setLastNameError(error.message);
        }
      });
    }
  }

  useEffect(() => {
    if (clerkUser.user?.firstName) {
      setFirstName(clerkUser.user.firstName);
    }

    if (clerkUser.user?.lastName) {
      setLastName(clerkUser.user.lastName);
    }

    if (clerkUser.user?.emailAddresses.map((email) => email.emailAddress)) {
      setEmailValue(clerkUser.user?.primaryEmailAddress?.emailAddress ?? "");
    }
  }, [
    clerkUser.user?.firstName,
    clerkUser.user?.lastName,
    clerkUser.user?.emailAddresses,
  ]);

  const router = useRouter();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailValue(e.target.value);

    try {
      SettingValidator.parse({ email: e.target.value });
      setEmailError(false);
    } catch (error) {
      setEmailError(true);
      if (error instanceof ZodError) {
        const errorFound = error.errors.find(
          (error) => error.path[0] == "email",
        );
        if (errorFound) {
          setEmailError(true);
        } else {
          setEmailError(false);
        }
      }
    }
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value);

    try {
      SettingValidator.parse({ firstName: e.target.value });
      setFirstNameError("");
    } catch (error) {
      if (error instanceof ZodError) {
        const errorFound = error.errors.find(
          (error) => error.path[0] == "firstName",
        );
        if (errorFound) {
          setFirstNameError(errorFound.message);
        } else {
          setFirstNameError("");
        }
      }
    }
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value);

    try {
      SettingValidator.parse({ lastName: e.target.value });
      setLastNameError("");
    } catch (error) {
      if (error instanceof ZodError) {
        const errorFound = error.errors.find(
          (error) => error.path[0] == "lastName",
        );
        if (errorFound) {
          setLastNameError(errorFound.message);
        } else {
          setLastNameError("");
        }
      }
    }
  };

  const handleCurrentPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPassword(e.target.value);
    setCurrentPasswordErrorMessage("");
  };

  const handleNewPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    setNewPasswordErrorMessage("");

    try {
      SettingValidator.parse({ password: e.target.value });
      setNewPasswordErrorMessage("");
    } catch (e) {
      if (e instanceof ZodError) {
        const errorFound = e.errors.find((e) => e.path[0] == "password");
        if (errorFound) {
          setNewPasswordErrorMessage(errorFound.message);
        } else {
          setNewPasswordErrorMessage("");
        }
      }
    }
  };

  useEffect(() => {
    if (emailValue != "" || firstName != "" || lastName != "") {
      test();
    }
  }, [handleLastNameChange, handleFirstNameChange, handleEmailChange]);

  async function checkPasswordAgainstClerkRules(
    currentPassword: string,
    newPassword: string,
  ) {
    try {
      try {
        SettingValidator.parse({ password: newPassword });
        setNewPasswordErrorMessage("");
      } catch (e) {
        if (e instanceof ZodError) {
          const errorFound = e.errors.find((e) => e.path[0] == "password");
          if (errorFound) {
            setNewPasswordErrorMessage(errorFound.message);
            return;
          } else {
            setNewPasswordErrorMessage("");
          }
        }
      }

      await clerkUser.user?.updatePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
      });
      setDialogOpen(false);
      toast.success("Password changed successfully");

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
        }
      }
    }
  }

  const firstNameSuccess =
    firstName != clerkUser.user?.firstName &&
    firstName.length != 0 &&
    firstNameError == "";
  const lastNameSuccess =
    lastName != clerkUser.user?.lastName &&
    lastName.length != 0 &&
    lastNameError == "";
  const emailSuccess =
    emailValue != clerkUser.user?.primaryEmailAddress?.emailAddress &&
    emailValue.length != 0 &&
    !emailError;

  const userDataHandler = async (data: FormSchemaUserUpdate) => {
    await updateConvexUserData({
      data: data,
    });
  };

  const submitHandler = async () => {
    const successList = [];
    const userDataToUpdate: FormSchemaUserUpdate = {};
    if (firstNameSuccess) {
      clerkUser.user?.update({ firstName: firstName });
      successList.push(" First Name");
      userDataToUpdate.firstName = firstName;
    }
    if (lastNameSuccess) {
      clerkUser.user?.update({ lastName: lastName });
      successList.push(" Last Name");
      userDataToUpdate.lastName = lastName;
    }

    if (emailSuccess) {
      userDataToUpdate.email = emailValue;
      setEmailValue(clerkUser.user?.primaryEmailAddress?.emailAddress || "");
    }

    await userDataHandler(userDataToUpdate);
    toast.success(
      successList.map((update) => {
        return update;
      }) + " updated successfully",
    );
  };

  return (
    <>
      <Toaster />
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
              {firstName != "" ? (
                firstNameError == "" ? (
                  <CircleCheck
                    className="absolute right-3 top-1/2 -translate-y-1/2 transform"
                    color="#3DC726"
                  />
                ) : (
                  <CircleX className="absolute right-3 top-1/2 -translate-y-1/2 transform text-accent" />
                )
              ) : (
                ""
              )}
            </div>
            <div className="ml-2 mt-0.5 text-[85%] text-secondary-foreground">
              {firstNameError != "" && firstName != "" ? (
                <p className="text-accent">{firstNameError}</p>
              ) : (
                "First Name"
              )}
            </div>
          </div>
          <div className="mb-4 w-11/12 lg:w-1/3">
            <div className="relative w-full">
              <Input
                placeholder="Last name"
                value={lastName}
                onChange={handleLastNameChange}
                className="border-2 border-secondary"
              />
              {lastName != "" ? (
                lastNameError == "" ? (
                  <CircleCheck
                    className="absolute right-3 top-1/2 -translate-y-1/2 transform"
                    color="#3DC726"
                  />
                ) : (
                  <CircleX className="absolute right-3 top-1/2 -translate-y-1/2 transform text-accent" />
                )
              ) : (
                ""
              )}
            </div>
            <div className="ml-2 mt-0.5 text-[85%] text-secondary-foreground">
              {lastNameError != "" && lastName != "" ? (
                <p className="text-accent">{lastNameError}</p>
              ) : (
                "Last Name"
              )}
            </div>
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
          <Dialog
            open={dialogOpen}
            onOpenChange={() => setDialogOpen((prevState) => !prevState)}
          >
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
          {lastNameSuccess ||
          firstNameSuccess ||
          (emailValue.length != 0 &&
            !emailError &&
            emailValue.toString() !=
              clerkUser.user?.emailAddresses
                .map((email) => email.emailAddress)
                .toString()) ||
          "" ? (
            <div className="mt-4 flex cursor-pointer rounded-sm border-2 border-secondary bg-primary p-2 px-3 text-[100%] text-destructive-foreground">
              <CircleCheck className="mr-2 h-5 w-5" />
              <p onClick={submitHandler}>Save Changes</p>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
};

export default SettingsPage;
