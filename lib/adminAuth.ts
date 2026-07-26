/** Shared admin-auth check for the dashboard's protected routes. */
import { timingSafeEqual } from "node:crypto";

export function adminEnabled(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function isAuthorized(req: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false; // no password configured → locked down
  const provided = (req.headers.get("authorization") || "").replace(
    /^Bearer\s+/i,
    "",
  );
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
