import {
  formSchemaUserUpdate,
  type FormSchemaUserUpdate,
} from "../../../../convex/lib/validators";

export async function POST(request: Request) {
  const unparsedData = (await request.json()) as FormSchemaUserUpdate;
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
