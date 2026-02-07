import * as Sentry from "@sentry/nextjs";

const getErrorName = (error: unknown): string => {
  if (error instanceof Error && error.name) {
    return error.name;
  }

  return "UnknownError";
};

export function reportSafeError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  const errorName = getErrorName(error);
  const safeExtra = {
    errorName,
    ...(extra ?? {}),
  };

  Sentry.captureMessage(context, {
    level: "error",
    extra: safeExtra,
  });

  console.error(context, safeExtra);
}
