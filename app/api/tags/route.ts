import { route } from "app/api";

import { getTags } from ".";

export const GET = route(async () => {
  return Response.json([...(await getTags())]);
});
