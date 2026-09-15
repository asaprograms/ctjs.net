import type { SearchParamProps, SlugProps } from "app/(utils)/next";
import VerifyComponent from "./VerifyComponent";

export default async function Page({ searchParams, params }: SearchParamProps & SlugProps<"user">) {
  const data = new FormData();
  data.set("nameOrId", params.user);

  const token = searchParams.token;
  let ok = false;

  if (typeof token === "string") {
    data.set("token", token);
    try {
      await fetch(`http://localhost:3000/api/users/${params.user}/verify`, {
        body: data,
        method: "POST",
      });
      ok = true;
    } catch {}
  }

  return <VerifyComponent ok={ok} />;
}
