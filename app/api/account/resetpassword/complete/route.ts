import { User, db } from "app/api";
import { ClientError, getFormData, getFormEntry, route } from "app/api/(utils)";
import { isPasswordValid } from "app/constants";
import bcrypt from "bcrypt";
import type { NextRequest } from "next/server";

export const POST = route(async (req: NextRequest) => {
  const form = await getFormData(req);
  const email = getFormEntry({ form, name: "email", type: "string" });
  const password = getFormEntry({ form, name: "password", type: "string" });
  const token = getFormEntry({ form, name: "token", type: "string" });

  const user = await db.user.findUnique({ where: { email } });

  // Intentionally vague errors so a user can't use this endpoint to query email addresses
  if (!user) throw new ClientError("Invalid email or token");
  if (user.passwordResetToken !== token) throw new ClientError("Invalid email or token");

  if (!isPasswordValid(password))
    throw new ClientError("Password must be at least 8 character long");

  await db.user.update({
    where: { email },
    data: {
      password: bcrypt.hashSync(password, await bcrypt.genSalt()),
      passwordResetToken: null,
    },
  });

  return new Response();
});
