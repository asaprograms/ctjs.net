import type { SlugProps } from "app/(utils)/next";
import { getAllowedVersions, getSessionFromCookies } from "app/api";
import { getOnePublic } from "app/api/modules";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import UploadReleaseComponent from "./UploadReleaseComponent";

export default async function Page({ params }: SlugProps<"nameOrId">) {
  const session = getSessionFromCookies(cookies());
  const { modVersions } = await getAllowedVersions();

  return (
    <UploadReleaseComponent
      module={(await getOnePublic(params.nameOrId, session)) ?? notFound()}
      validModVersions={modVersions}
    />
  );
}
