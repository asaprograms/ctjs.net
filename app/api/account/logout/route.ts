import { route, setSession } from "app/api";
import { NextResponse } from "next/server";

export const POST = route(async () => {
  const response = new NextResponse("Logged out");
  setSession(response.cookies, null);
  return response;
});
