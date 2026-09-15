import type { AuthenticatedUser, Session } from "app/api";

// Safeguard against accidentally forgetting to change this environment variable in prod
const ignoreEmailVerification =
  process.env.NEXT_PUBLIC_IGNORE_EMAIL_VERIFICATION === "true" &&
  process.env.NODE_ENV !== "production";

// This function is used in client side files, and thus can't be in "api"
export function isEmailVerified(sessionOrUser: Session | AuthenticatedUser) {
  if (ignoreEmailVerification) return true;
  if ("emailVerified" in sessionOrUser) return sessionOrUser.emailVerified;
  return sessionOrUser.email_verified ?? false;
}
