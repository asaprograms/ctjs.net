import type { SearchParamProps } from "app/(utils)/next";
import { User, db } from "app/api";

import InitiateResetComponent from "./InitiateResetComponent";
import InvalidTokenComponent from "./InvalidTokenComponent";
import ResetPasswordComponent from "./ResetPasswordComponent";

export default async function Page({ searchParams }: SearchParamProps) {
  const token = searchParams.token;
  if (typeof token === "string") {
    const user = await db.user.findFirst({ where: { passwordResetToken: token } });
    if (!user) return <InvalidTokenComponent />;
    if (user.passwordResetToken !== token) return <InvalidTokenComponent />;
    return <ResetPasswordComponent email={user.email} token={token} />;
  }

  return <InitiateResetComponent />;
}
