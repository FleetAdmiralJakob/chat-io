import { formSchemaUserUpdate } from "#convex/lib/validators";

export async function POST(request: Request) {
  let unparsedData: unknown;

  try {
    unparsedData = await request.json();
  } catch {
    return Response.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsedData = formSchemaUserUpdate.safeParse(unparsedData);

  if (!parsedData.success) {
    return Response.json(
      { success: false, errors: parsedData.error.issues },
      { status: 400 },
    );
  }

  return Response.json(
    { success: true, data: parsedData.data },
    { status: 200 },
  );
}
