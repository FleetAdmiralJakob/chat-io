"use client";

import { useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { api } from "#convex/_generated/api";
import {
  type FormSchemaUserUpdate,
  type formSchemaUserUpdate,
} from "#convex/lib/validators";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { env } from "~/env";
import { useMutation } from "convex/react";
import {
  ChevronLeft,
  CircleCheck,
  CircleX,
  HardDriveUpload,
  MailCheck,
  MailX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z, ZodError } from "zod";

const SettingValidator = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, {
      error: "Password must be at least 8 characters.",
    })
    .max(20, {
      error: "Password must be at most 20 characters.",
    }),
  firstName: z
    .string()
    .min(2, {
      error: "Name must be at least 2 characters.",
    })
    .max(20, {
      error: "Name must be at most 20 characters.",
    }),
  lastName: z
    .string()
    .min(2, {
      error: "Name must be at least 2 characters.",
    })
    .max(20, {
      error: "Name must be at most 20 characters.",
    }),
});

const base64ToUint8Array = (base64: string) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(b64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function SettingsContent() {
  const clerkUser = useUser();

  const [lastName, setLastName] = useState(clerkUser.user?.lastName ?? "");
  const [firstName, setFirstName] = useState(clerkUser.user?.firstName ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPasswordErrorMessage, setCurrentPasswordErrorMessage] =
    useState("");
  const [newPasswordErrorMessage, setNewPasswordErrorMessage] = useState("");
  const [emailValue, setEmailValue] = useState(
    clerkUser.user?.primaryEmailAddress?.emailAddress ?? "",
  );
  const [emailError, setEmailError] = useState(false);
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");

  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const subscribeToPush = useMutation(api.notifications.subscribe);
  const unsubscribeFromPush = useMutation(api.notifications.unsubscribe);

  useEffect(() => {
    // Check if the browser supports notifications at all
    if (!("Notification" in window)) {
      return;
    }

    // Check if the user currently blocks notifications
    if (Notification.permission === "denied") {
      setIsPushEnabled(false);
      return;
    }

    // Check if service workers are supported
    if (!("serviceWorker" in navigator)) {
      return;
    }

    // Wait for the service worker to be fully registered and ready,
    // then check if we have an active push subscription
    void navigator.serviceWorker.ready.then((reg) => {
      void reg.pushManager.getSubscription().then((sub) => {
        // Only set push as enabled if we have an active subscription
        // AND the user hasn't revoked notification permissions
        if (sub && Notification.permission === "granted") {
          setIsPushEnabled(true);
        }
      });
    });
  }, []);

  const handlePushToggle = async (checked: boolean) => {
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (checked) {
        if (!env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
          throw new Error("VAPID Public Key not found");
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(
            env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          ),
        });
        // Serialize keys
        const p256dh = sub.getKey("p256dh");
        const auth = sub.getKey("auth");
        if (!p256dh || !auth) throw new Error("Missing keys");

        await subscribeToPush({
          endpoint: sub.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
            auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
          },
        });
        setIsPushEnabled(true);
        toast.success("Notifications enabled");
      } else {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribeFromPush({ endpoint: sub.endpoint });
          await sub.unsubscribe();
        }
        setIsPushEnabled(false);
        toast.success("Notifications disabled");
      }
    } catch (e) {
      console.error(e);

      // Check if the error was due to denied notification permission
      if (Notification.permission === "denied") {
        toast.error(
          "Notifications blocked. Please enable them in your browser settings."
        );
      } else {
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        toast.error(`Failed to update notifications: ${errorMessage}`);
      }

      // Revert state if failed
      setIsPushEnabled(!checked);
    } finally {
      setPushLoading(false);
    }
  };

  // ============================================================================
  // DIRTY FLAGS - Prevent race conditions between user edits and Clerk updates
  // ============================================================================
  //
  // Problem: Clerk can update user data at any time (e.g., from another browser tab,
  // background sync, or external API call). Without these flags, if you're typing
  // "John" into the firstName field and Clerk decides to sync, it would overwrite
  // your in-progress edit with the old value from the server. Frustrating!
  //
  // Solution: Track whether the user has started editing each field ("dirty" state).
  // - When a user types in a field → set the dirty flag to TRUE
  // - When syncing from Clerk → only update if the dirty flag is FALSE
  // - After successful save → reset the dirty flag to FALSE (allow future syncs)
  //
  // This ensures user edits are never lost due to external data updates.
  // ============================================================================
  const [isFirstNameDirty, setIsFirstNameDirty] = useState(false);
  const [isLastNameDirty, setIsLastNameDirty] = useState(false);
  const [isEmailDirty, setIsEmailDirty] = useState(false);

  // ============================================================================
  // CLERK → LOCAL STATE SYNC
  // ============================================================================
  // This effect syncs data FROM Clerk INTO our local form state.
  //
  // WHY: When the page loads or Clerk data changes externally, we want to
  // display the latest values in the form inputs.
  //
  // THE CATCH: We ONLY sync if the user hasn't started editing that field yet!
  // (That's what the dirty flags are for - see comments above)
  //
  // Example flow:
  // 1. Page loads, dirty flags are all FALSE → Clerk data fills the form ✓
  // 2. User starts typing firstName → isFirstNameDirty becomes TRUE
  // 3. Clerk syncs new data → firstName is SKIPPED (dirty), others still sync ✓
  // 4. User saves → isFirstNameDirty resets to FALSE → future syncs work again ✓
  //
  // Reference: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  // ============================================================================
  useEffect(() => {
    // Only sync firstName if the user hasn't modified it yet
    if (clerkUser.user?.firstName && !isFirstNameDirty) {
      setFirstName(clerkUser.user.firstName);
    }

    // Only sync lastName if the user hasn't modified it yet
    if (clerkUser.user?.lastName && !isLastNameDirty) {
      setLastName(clerkUser.user.lastName);
    }

    // Only sync email if user hasn't modified it yet
    if (clerkUser.user?.primaryEmailAddress?.emailAddress && !isEmailDirty) {
      setEmailValue(clerkUser.user.primaryEmailAddress.emailAddress);
    }
  }, [
    clerkUser.user?.firstName,
    clerkUser.user?.lastName,
    clerkUser.user?.primaryEmailAddress?.emailAddress,
    isFirstNameDirty,
    isLastNameDirty,
    isEmailDirty,
  ]);

  const updateConvexUserData = useMutation(api.users.updateUserData);

  const validateProfileOnServer = useCallback(async () => {
    const valuesObject: z.infer<typeof formSchemaUserUpdate> = {
      email: emailValue,
      firstName: firstName,
      lastName: lastName,
    };

    const response = await fetch("/api/validate-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(valuesObject),
    });

    const responseBody = (await response.json()) as {
      success: boolean;
      errors?: { path: (string | number)[]; message: string }[];
    };

    if (responseBody.success) {
      // Clear all errors when validation passes
      setEmailError(false);
      setFirstNameError("");
      setLastNameError("");
      return;
    }

    // Reset errors before setting new ones
    setEmailError(false);
    setFirstNameError("");
    setLastNameError("");

    if (responseBody.errors) {
      responseBody.errors.forEach(
        (error: { path: (string | number)[]; message: string }) => {
          if (error.path[0] === "email") {
            setEmailError(true);
          }
          if (error.path[0] === "firstName") {
            setFirstNameError(error.message);
          }
          if (error.path[0] === "lastName") {
            setLastNameError(error.message);
          }
        },
      );
    }
  }, [emailValue, firstName, lastName]);

  const router = useRouter();

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Mark email as "dirty" - the user is now editing, so don't let Clerk overwrite!
      setIsEmailDirty(true);
      setEmailValue(e.target.value);

      try {
        SettingValidator.parse({ email: e.target.value });
        setEmailError(false);
      } catch (error) {
        setEmailError(true);
        if (error instanceof ZodError) {
          const errorFound = error.issues.find(
            (error) => error.path[0] == "email",
          );
          if (errorFound) {
            setEmailError(true);
          } else {
            setEmailError(false);
          }
        }
      }
    },
    [],
  );

  const handleFirstNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Mark firstName as "dirty" - user is now editing, so don't let Clerk overwrite!
      setIsFirstNameDirty(true);
      setFirstName(e.target.value);

      try {
        SettingValidator.parse({ firstName: e.target.value });
        setFirstNameError("");
      } catch (error) {
        if (error instanceof ZodError) {
          const errorFound = error.issues.find(
            (error) => error.path[0] == "firstName",
          );
          if (errorFound) {
            setFirstNameError(errorFound.message);
          } else {
            setFirstNameError("");
          }
        }
      }
    },
    [],
  );

  const handleLastNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Mark lastName as "dirty" - user is now editing, so don't let Clerk overwrite!
      setIsLastNameDirty(true);
      setLastName(e.target.value);

      try {
        SettingValidator.parse({ lastName: e.target.value });
        setLastNameError("");
      } catch (error) {
        if (error instanceof ZodError) {
          const errorFound = error.issues.find(
            (error) => error.path[0] == "lastName",
          );
          if (errorFound) {
            setLastNameError(errorFound.message);
          } else {
            setLastNameError("");
          }
        }
      }
    },
    [],
  );

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
        const errorFound = e.issues.find((e) => e.path[0] == "password");
        if (errorFound) {
          setNewPasswordErrorMessage(errorFound.message);
        } else {
          setNewPasswordErrorMessage("");
        }
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailValue != "" || firstName != "" || lastName != "") {
        void validateProfileOnServer();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    handleLastNameChange,
    handleFirstNameChange,
    handleEmailChange,
    emailValue,
    firstName,
    lastName,
    validateProfileOnServer,
  ]);

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
          const errorFound = e.issues.find((e) => e.path[0] == "password");
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
    const updateUserPromise = (async () => {
      const successList: string[] = [];
      const userDataToUpdate: FormSchemaUserUpdate = {};

      if (firstNameSuccess) {
        void clerkUser.user?.update({ firstName: firstName });
        successList.push("First Name");
        userDataToUpdate.firstName = firstName;
        // Reset dirty flag → allow Clerk to sync this field again in the future
        setIsFirstNameDirty(false);
      }
      if (lastNameSuccess) {
        void clerkUser.user?.update({ lastName: lastName });
        successList.push("Last Name");
        userDataToUpdate.lastName = lastName;
        // Reset dirty flag → allow Clerk to sync this field again in the future
        setIsLastNameDirty(false);
      }

      if (emailSuccess) {
        userDataToUpdate.email = emailValue;
        setEmailValue(clerkUser.user?.primaryEmailAddress?.emailAddress ?? "");
        // Reset dirty flag → allow Clerk to sync this field again in the future
        setIsEmailDirty(false);
      }

      await userDataHandler(userDataToUpdate);

      return successList;
    })();

    toast.promise(updateUserPromise, {
      loading: "Updating user data...",
      success: (successList: string[]) => {
        return `${successList.join(", ")} updated successfully`;
      },
      error: "Error updating user data",
    });
  };

  return (
    <>
      <div className="text-destructive-foreground flex justify-center lg:hidden">
        <p className="absolute top-12 text-xl font-semibold">Settings</p>
        <ChevronLeft
          className="absolute top-11 left-10 h-8 w-8"
          onClick={() => {
            router.back();
          }}
        />
      </div>
      <main className="flex h-screen flex-col items-center justify-center lg:ml-24">
        <div className="flex h-2/3 w-full flex-col items-center justify-center gap-7 sm:h-1/2">
          <div className="mb-4 w-11/12 lg:w-1/3">
            <div className="relative w-full">
              <Input
                placeholder="First name"
                value={firstName}
                onChange={handleFirstNameChange}
                className="border-secondary border-2"
              />
              {firstName != "" ? (
                firstNameError == "" ? (
                  <CircleCheck
                    className="absolute top-1/2 right-3 -translate-y-1/2 transform"
                    color="#3DC726"
                  />
                ) : (
                  <CircleX className="text-accent absolute top-1/2 right-3 -translate-y-1/2 transform" />
                )
              ) : (
                ""
              )}
            </div>
            <div className="text-secondary-foreground mt-0.5 ml-2 text-[85%]">
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
                className="border-secondary border-2"
              />
              {lastName != "" ? (
                lastNameError == "" ? (
                  <CircleCheck
                    className="absolute top-1/2 right-3 -translate-y-1/2 transform"
                    color="#3DC726"
                  />
                ) : (
                  <CircleX className="text-accent absolute top-1/2 right-3 -translate-y-1/2 transform" />
                )
              ) : (
                ""
              )}
            </div>
            <div className="text-secondary-foreground mt-0.5 ml-2 text-[85%]">
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
                className="border-secondary w-full border-2"
              />
              {emailValue != "" ? (
                !emailError ? (
                  <MailCheck
                    className="absolute top-1/2 right-3 -translate-y-1/2 transform"
                    color="#3DC726"
                  />
                ) : (
                  <MailX className="text-accent absolute top-1/2 right-3 -translate-y-1/2 transform" />
                )
              ) : (
                ""
              )}
            </div>
            <p className="text-secondary-foreground mt-0.5 ml-2 text-[85%]">
              If you forgot your password we can send you an Email
            </p>
          </div>
          <div className="mb-4 w-11/12 lg:w-1/3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="push-notifications"
                checked={isPushEnabled}
                onCheckedChange={(checked) =>
                  handlePushToggle(checked === true)
                }
                disabled={pushLoading}
              />
              <label
                htmlFor="push-notifications"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enable Push Notifications
              </label>
            </div>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={() => setDialogOpen((prevState) => !prevState)}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <HardDriveUpload className="h-5 w-5" />
                <p>Update Password</p>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-106.25">
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
                    className="text-accent text-right text-[80%]"
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
                    className="text-accent text-right text-[80%]"
                  >
                    {newPasswordErrorMessage}
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={() => {
                    void checkPasswordAgainstClerkRules(
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
            <Button onClick={submitHandler} className="gap-2">
              <CircleCheck className="h-5 w-5" />
              <p>Save Changes</p>
            </Button>
          ) : null}
        </div>
      </main>
    </>
  );
}
