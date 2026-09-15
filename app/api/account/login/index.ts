import {
  ClientError,
  getFormData,
  getFormEntry,
  getSessionFromRequest,
  setSession,
} from "app/api/(utils)";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { verify } from "..";

export const signIn = async (req: NextRequest) => {
  const session = getSessionFromRequest(req);
  if (session) return Response.json(session);

  const form = await getFormData(req);
  const username = getFormEntry({ form, name: "username", type: "string" });
  const password = getFormEntry({ form, name: "password", type: "string" });

  const user = await verify(username, password);
  if (!user) throw new ClientError("Invalid credentials");

  const authedUser = await user.publicAuthenticated();
  const response = NextResponse.json(authedUser);
  setSession(response.cookies, authedUser);

  return response;
};
