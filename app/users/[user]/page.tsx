import type { SearchParamProps, SlugProps } from "app/(utils)/next";
import { getSessionFromCookies, toParams } from "app/api";
import * as modules from "app/api/modules";
import * as users from "app/api/users";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import UserComponent from "./UserComponent";

const MODULES_PER_PAGES = 25;

export default async function Page({ params, searchParams }: SlugProps<"user"> & SearchParamProps) {
  const sessionUser = getSessionFromCookies(cookies());
  const user = (await users.getUser(params.user)) ?? notFound();

  const response = await modules.getManyPublic(
    toParams({
      ...searchParams,
      owner: user.id,
      limit: MODULES_PER_PAGES.toString(),
      hidden: sessionUser ? modules.Hidden.ALL : modules.Hidden.NONE,
      hide_empty: sessionUser ? "false" : "true",
    }),
  );

  return (
    <UserComponent
      user={sessionUser ? await user.publicAuthenticated() : user.public()}
      authenticated={!!sessionUser}
      modules={response}
      totalDownloads={await users.getDownloads(user)}
    />
  );
}
