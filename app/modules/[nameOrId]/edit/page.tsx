import type { SlugProps } from "app/(utils)/next";
import { getSessionFromCookies } from "app/api";
import * as modules from "app/api/modules";
import { getTags } from "app/api/tags";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import EditModuleComponent from "./EditModuleComponent";

export default async function Page({ params }: SlugProps<"nameOrId">) {
  const user = getSessionFromCookies(cookies());
  const targetModule = (await modules.getOne(params.nameOrId)) ?? notFound();

  if (!user || user.id !== targetModule.user.id) notFound();

  const tags = await getTags();

  return (
    <EditModuleComponent targetModule={await targetModule.public()} availableTags={[...tags]} />
  );
}
