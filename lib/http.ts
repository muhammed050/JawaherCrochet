import { ZodError } from "zod";
export function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const status =
    message === "UNAUTHORIZED"
      ? 401
      : message === "FORBIDDEN"
        ? 403
        : message === "STORE_NOT_CONFIGURED"
          ? 503
          : error instanceof ZodError
            ? 400
            : message === "INVALID_ORIGIN"
              ? 403
              : 500;
  return Response.json(
    {
      error:
        status === 503
          ? "STORE_NOT_CONFIGURED"
          : status === 400
            ? "INVALID_INPUT"
            : status === 401
              ? "UNAUTHORIZED"
              : status === 403
                ? "FORBIDDEN"
                : "REQUEST_FAILED",
    },
    { status },
  );
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ).origin;
  if (origin !== expected) throw new Error("INVALID_ORIGIN");
}
