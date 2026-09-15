import { db } from "app/api";
import { getFormData, getFormEntry, route } from "app/api/(utils)";
import { sendVerificationEmail } from "app/api/(utils)/email";
import type { NextRequest } from "next/server";

export const POST = route(async (req: NextRequest) => {
  const form = await getFormData(req);
  const email = getFormEntry({ form, name: "email", type: "string" });

  const user = await db.user.findUnique({ where: { email } });

  // No error here so a user can't use this endpoint to query email addresses
  if (!user) return new Response();

  await sendVerificationEmail(user);
  return new Response();
});
