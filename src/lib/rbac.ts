import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import type { Role, User } from "@/generated/prisma/client";

/** Redirects to login if not authenticated. Use in guarded layouts/pages. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  return user;
}

/** Redirects to login if unauthenticated, or home if authenticated with the wrong role. */
export async function requireRole(role: Role): Promise<User> {
  const user = await requireUser();
  if (user.role !== role) redirect("/");
  return user;
}
