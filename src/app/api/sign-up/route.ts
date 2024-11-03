import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/shared";
import {
  formSchemaSignUp,
  formSchemaUserUpdate,
  type FormSchemaSignUp,
  type FormSchemaUserUpdate,
} from "~/lib/validators";

export async function OPTIONS(request: Request) {
  const unparsedSignUpHeaders = (await request.json()) as FormSchemaUserUpdate;
  const parsedSignUpHeaders = formSchemaUserUpdate.safeParse(
    unparsedSignUpHeaders,
  );
  if (!parsedSignUpHeaders.success) {
    return Response.json(
      { message: parsedSignUpHeaders.error.message },
      { status: 400 },
    );
  } else {
    return Response.json(
      { message: parsedSignUpHeaders.error },
      { status: 200 },
    );
  }
}

// TODO: This probably deserves a rate limiter + a check for not creating a bunch of trash users to spam us.
export async function POST(request: Request) {
  const unparsedSignUpHeaders = (await request.json()) as FormSchemaSignUp;
  const parsedSignUpHeaders = formSchemaSignUp.safeParse(unparsedSignUpHeaders);
  if (!parsedSignUpHeaders.success) {
    return Response.json(
      { message: parsedSignUpHeaders.error.message },
      { status: 400 },
    );
  }

  try {
    const awaitedClerkClient = await clerkClient();
    await awaitedClerkClient.users.createUser({
      username:
        parsedSignUpHeaders.data.username + parsedSignUpHeaders.data.usernameId,
      firstName: parsedSignUpHeaders.data.firstName,
      lastName: parsedSignUpHeaders.data.lastName,
      emailAddress: parsedSignUpHeaders.data.email
        ? [parsedSignUpHeaders.data.email]
        : undefined,
      password: parsedSignUpHeaders.data.password,
    });
  } catch (e) {
    if (isClerkAPIResponseError(e)) {
      if (e.errors.some((error) => error.code === "form_identifier_exists")) {
        if (
          e.errors.some((error) => error.meta?.paramName === "email_address")
        ) {
          return Response.json(
            {
              message: "Failed to create an account. Email already exists.",
              statusText: "email_is_taken",
            },
            { status: 400 },
          );
        }

        if (e.errors.some((error) => error.meta?.paramName === "username")) {
          return Response.json(
            {
              message: "Failed to create an account. Username already exists.",
              statusText: "username_is_taken",
            },
            { status: 400 },
          );
        }
      }
      if (e.errors.some((error) => error.code === "form_password_pwned")) {
        return Response.json(
          {
            message:
              "Failed to create an account. Password has been found in an online data breach.",
            statusText: "form_password_pwned",
          },
          { status: 400 },
        );
      }
    }
    console.error(parsedSignUpHeaders, e);
    return Response.json(
      { message: "Failed to create an account" },
      { status: 400 },
    );
  }

  return Response.json(
    { message: "User created successfully" },
    { status: 200 },
  );
}
