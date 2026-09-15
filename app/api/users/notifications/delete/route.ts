import { BadQueryParamError, ClientError, MissingQueryParamError, route } from "app/api";
import { Notification, db } from "app/api";

/**
 * {
 *   "id": string,
 *   "user_id": string,
 * }
 */
export const DELETE = route(async req => {
  if (req.headers.get("content-type") !== "application/json")
    return new Response("Expected application/json", { status: 400 });

  const body = await req.json();

  if (typeof body !== "object" || Array.isArray(body))
    throw new ClientError("Malformed body JSON data");

  if (typeof body.id !== "string") throw new BadQueryParamError("id", body.id);
  if (typeof body.user_id !== "string") throw new BadQueryParamError("user_id", body.user_id);

  const id = Number.parseInt(body.id);
  const userId = body.user_id;

  if (!id) throw new MissingQueryParamError("id");
  if (!userId) throw new MissingQueryParamError("user_id");

  await db.notification.delete({ where: { id, userId } });

  return new Response("Deleted notification");
});
