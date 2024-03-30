import { type FormSchema, formSchema } from "~/lib/validators";
import { clerkClient } from "@clerk/nextjs";

// This probably deserves a rate limiter + a check for not creating a bunch of trash users to spam us.
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
    return new Response("Uh oh, something went wrong", { status: 400 });
  }

  return new Response("User created successfully", { status: 200 });
}
