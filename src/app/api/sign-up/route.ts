import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { clerkClient } from "@clerk/nextjs/server";
import { formSchemaSignUp, type FormSchemaSignUp } from "~/lib/validators";
import { log } from "next-axiom";
import { after } from "next/server";

/* TODO:
 * This probably deserves a rate limiter + a check for not creating a bunch of trash users to spam us.
 * Arcjet has good ratelimiting. Take a look at Upstash as well. */
export async function POST(request: Request) {
  const unparsedSignUpHeaders = (await request.json()) as FormSchemaSignUp;
  const parsedSignUpHeaders = formSchemaSignUp.safeParse(unparsedSignUpHeaders);
  if (!parsedSignUpHeaders.success) {
    after(() => {
      log.error(
        "Could not parse the sign-up headers",
        parsedSignUpHeaders.error,
      );
    });

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
      // Helper to safely get paramName from error meta
      const getParamName = (error: { meta?: Record<string, unknown> }) => {
        if (error.meta && typeof error.meta.paramName === "string") {
          return error.meta.paramName;
        }
        return undefined;
      };

      if (e.errors.some((error) => error.code === "form_identifier_exists")) {
        if (e.errors.some((error) => getParamName(error) === "email_address")) {
          after(() => {
            log.error("Failed to create an account. Email already exists.");
          });

          return Response.json(
            {
              message: "Failed to create an account. Email already exists.",
              statusText: "email_is_taken",
            },
            { status: 400 },
          );
        }

        if (e.errors.some((error) => getParamName(error) === "username")) {
          after(() => {
            log.error("Failed to create an account. Username already exists.");
          });

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
        after(() => {
          log.error(
            "Failed to create an account. Password has been found in an online data breach.",
          );
        });

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

    after(() => {
      log.error("Failed to create an account", {
        parsedSignUpHeaders,
        error: e,
      });
    });

    return Response.json(
      { message: "Failed to create an account" },
      { status: 400 },
    );
  }

  after(() => {
    log.info("User created successfully");
  });

  return Response.json(
    { message: "User created successfully" },
    { status: 200 },
  );
}
