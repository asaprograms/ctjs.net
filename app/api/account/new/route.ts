import {
  BadQueryParamError,
  ClientError,
  ConflictError,
  getFormData,
  getFormEntry,
  getSessionFromRequest,
  route,
  sendVerificationEmail,
  setSession,
} from "app/api";
import { User, db } from "app/api";
import * as account from "app/api/account";
import { isEmailValid, isPasswordValid, isUsernameValid } from "app/constants";
import bcrypt from "bcrypt";
import { type NextRequest, NextResponse } from "next/server";

export const PUT = route(async (req: NextRequest) => {
  const existingSession = getSessionFromRequest(req);
  if (existingSession) throw new ConflictError("Already authenticated");

  const form = await getFormData(req);
  const name = getFormEntry({ form, name: "username", type: "string" });
  const email = getFormEntry({ form, name: "email", type: "string" });
  const image = getFormEntry({
    form,
    name: "image",
    type: "file",
    optional: true,
  });
  const password = getFormEntry({ form, name: "password", type: "string" });

  if (!isUsernameValid(name)) throw new BadQueryParamError("username", name);
  if (!isEmailValid(email)) throw new BadQueryParamError("email", email);
  if (!isPasswordValid(password))
    throw new ClientError("Password must be at least 8 characters long");

  const userByName = await db.user.findUnique({ where: { name } });
  if (userByName) throw new ConflictError("Username already taken");

  const userByEmail = await db.user.findUnique({ where: { email } });
  if (userByEmail) throw new ConflictError("Email already taken");

  const imagePath = image ? await account.saveImage(name, image) : undefined;
  const user = await db.user.create({
    data: {
      name,
      email,
      emailVerified: false,
      password: bcrypt.hashSync(password, bcrypt.genSaltSync()),
      image: imagePath,
    },
  });

  // Log the user in and send the verification email
  const authedUser = await user.publicAuthenticated();
  const response = NextResponse.json(authedUser, { status: 201 });
  setSession(response.cookies, authedUser);
  await sendVerificationEmail(user);
  return response;
});
