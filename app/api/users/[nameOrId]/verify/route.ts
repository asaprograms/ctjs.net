import type { SlugProps } from "app/(utils)/next";
import { ClientError, db, route, setSession } from "app/api";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const POST = route(async (req: NextRequest, { params }: SlugProps<"nameOrId">) => {
  const data = await req.formData();
  const token = data.get("token");
  const nameOrId = data.get("nameOrId");

  if (!token || typeof token !== "string") throw new ClientError("Missing verification token");
  const dbUser = await db.user.findFirst({ where: { verificationToken: token } });
  if (!dbUser || (dbUser.name !== nameOrId && dbUser.id.toString() !== nameOrId))
    throw new ClientError("Invalid verification token or username");

  const newUser = await db.user.update({
    where: {
      id: dbUser.id,
    },
    data: {
      emailVerified: true,
      verificationToken: null,
    },
  });

  setSession(cookies(), await newUser.publicAuthenticated());
  return new Response("Email verified");
});
