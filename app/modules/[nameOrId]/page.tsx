import type { SlugProps } from "app/(utils)/next";
import { getSessionFromCookies } from "app/api";
import * as modules from "app/api/modules";
import * as users from "app/api/users";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import ModuleComponent from "./ModuleComponent";

export default async function Page({ params }: SlugProps<"nameOrId">) {
  const user = getSessionFromCookies(cookies());

  const [authedUser, module] = await Promise.all([
    user ? users.getUser(user?.id) : undefined,
    modules.getOne(params.nameOrId),
  ]);

  return (
    <ModuleComponent
      module={(await module?.public(user)) ?? notFound()}
      user={await authedUser?.publicAuthenticated()}
    />
  );
}
