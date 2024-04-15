import { type FormSchema, formSchema } from "~/lib/validators";
import { clerkClient } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/shared";

// TODO: This probably deserves a rate limiter + a check for not creating a bunch of trash users to spam us.
export async function POST(request: Request) {
  const unparsedSignUpHeaders = (await request.json()) as FormSchema;
  const parsedSignUpHeaders = formSchema.safeParse(unparsedSignUpHeaders);
  if (!parsedSignUpHeaders.success) {
    return new Response(parsedSignUpHeaders.error.message, { status: 400 });
  }

  try {
    await clerkClient.users.createUser({
      username:
        parsedSignUpHeaders.data.username + parsedSignUpHeaders.data.usernameId,
      firstName: parsedSignUpHeaders.data.firstName,
      lastName: parsedSignUpHeaders.data.lastName,
      password: parsedSignUpHeaders.data.password,
    });
  } catch (e) {
    if (isClerkAPIResponseError(e)) {
      if (e.errors.some((error) => error.code === "form_identifier_exists")) {
        return new Response(
          "Failed to create an account. Username already exists.",
          { status: 400, statusText: "username_is_taken" },
        );
      }
      if (e.errors.some((error) => error.code === "form_password_pwned")) {
        return new Response(
          "Failed to create an account. Password has been found in an online data breach.",
          { status: 400, statusText: "form_password_pwned" },
        );
      }
    }
    return new Response("Failed to create an account", { status: 400 });
  }

  return new Response("User created successfully", { status: 200 });
}
