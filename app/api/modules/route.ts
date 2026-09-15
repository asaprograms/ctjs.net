import { isEmailVerified } from "app/(utils)";
import {
  ClientError,
  ForbiddenError,
  NotAuthenticatedError,
  ServerError,
  getFormData,
  getFormEntry,
  getSessionFromRequest,
  route,
} from "app/api";
import { Module, User, db } from "app/api";
import * as modules from "app/api/modules";
import { isModuleValid as isModuleNameValid } from "app/constants";
import type { NextRequest } from "next/server";

import { getTags } from "../tags";

export const GET = route(async (req: NextRequest) => {
  return Response.json(await modules.getManyPublic(req.nextUrl.searchParams));
});

export const PUT = route(async (req: NextRequest) => {
  const session = getSessionFromRequest(req);
  if (!session) throw new NotAuthenticatedError();
  if (!isEmailVerified(session)) throw new ForbiddenError("Email not verified");

  const user = await db.user.getFromSession(session);
  if (!user) throw new ServerError("Internal error: Failed to find user for session");

  const form = await getFormData(req);
  const name = await getFormEntry({ form, name: "name", type: "string" });

  const existingModule = await db.module.findUnique({ where: { name } });
  if (existingModule) throw new ClientError(`A module with name ${name} already exists`);

  if (!isModuleNameValid(name)) {
    throw new ClientError(
      "Module name must be between 3 and 64 characters, and can only contain letters, numbers, and underscores",
    );
  }

  const summary = await getFormEntry({
    form,
    name: "summary",
    type: "string",
    optional: true,
  });
  if (summary && summary.length > 300)
    throw new ClientError("Module summary cannot be more than 300 characters");

  const description = await getFormEntry({
    form,
    name: "description",
    type: "string",
    optional: true,
  });

  const image = await getFormEntry({
    form,
    name: "image",
    type: "file",
    optional: true,
  });

  const hidden = await getFormEntry({
    form,
    name: "hidden",
    type: "string",
    optional: true,
  });
  if (hidden && hidden !== "1" && hidden !== "true" && hidden !== "0" && hidden !== "false")
    throw new ClientError("Module hidden flag must be a boolean string");

  const tags = modules.getTagsFromForm(form);
  const allowedTags = await getTags();
  const disallowedTags: string[] = [];
  for (const tag of tags) {
    if (!allowedTags.has(tag)) disallowedTags.push(tag);
  }

  if (disallowedTags.length) {
    const formatter = new Intl.ListFormat("en", {
      style: "long",
      type: "conjunction",
    });
    throw new ClientError(`The tags ${formatter.format(disallowedTags)} are not allowed`);
  }

  const module = await db.module.create({
    data: {
      userId: user.id,
      name,
      summary,
      description,
      image: null,
      tags: tags.join(","),
      hidden: hidden === "1" || hidden === "true",
    },
  });

  if (image) await modules.saveImage(module, image);

  return new Response("Module created", { status: 201 });
});
