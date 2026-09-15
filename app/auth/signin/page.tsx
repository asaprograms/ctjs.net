import { getSessionFromCookies } from "app/api";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import SignInComponent from "./SignInComponent";

export default function Page() {
  const user = getSessionFromCookies(cookies());
  return user ? redirect("/") : <SignInComponent />;
}
