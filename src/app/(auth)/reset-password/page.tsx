"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";

export const dynamic = "force-static";

export default function ResetPasswordPage() {
  return (
    <SignIn.Root>
      <SignIn.Strategy name="email_code">
        <Clerk.Field name="code">
          <Clerk.Label>Code</Clerk.Label>
          <Clerk.Input />
          <Clerk.FieldError />
        </Clerk.Field>
        <SignIn.Action submit>Verify</SignIn.Action>
      </SignIn.Strategy>
      <SignIn.Step name="reset-password">
        <Clerk.Field name="password">
          <Clerk.Label>New password</Clerk.Label>
          <Clerk.Input />
          <Clerk.FieldError />
        </Clerk.Field>
        <Clerk.Field name="confirmPassword">
          <Clerk.Label>Confirm password</Clerk.Label>
          <Clerk.Input />
          <Clerk.FieldError />
        </Clerk.Field>
        <SignIn.Action submit>Update password</SignIn.Action>
      </SignIn.Step>
    </SignIn.Root>
  );
}
