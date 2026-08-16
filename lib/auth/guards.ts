import "server-only";
import { auth } from "@/lib/auth";

export const ADMIN_ROLES = ["ADMIN", "SUPPORT", "COMPLIANCE"];

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Requires an authenticated, active investor session. Used in API routes. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new AuthError("Authentication required.", 401);
  if (session.user.status !== "ACTIVE") {
    throw new AuthError("Your account is not active. Contact support.", 403);
  }
  return session.user;
}

/** Requires an authenticated user with an admin-console role. */
export async function requireAdmin() {
  const user = await requireUser();
  if (!ADMIN_ROLES.includes(user.role)) {
    throw new AuthError("Administrator access required.", 403);
  }
  return user;
}

export async function requireRole(roles: string[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AuthError("You do not have permission to perform this action.", 403);
  }
  return user;
}
