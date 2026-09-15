import { BadQueryParamError, ClientError, MissingQueryParamError, route } from "app/api";
import { Notification, db } from "app/api";

/**
 * {
 *   "ids": string[],
 *   "user_id": string,
 * }
 */
export const PATCH = route(async req => {
  if (req.headers.get("content-type") !== "application/json")
    return new Response("Expected application/json", { status: 400 });

  const body = await req.json();

  if (typeof body !== "object" || Array.isArray(body))
    throw new ClientError("Malformed body JSON data");

  const ids = body.ids;
  const user_id = body.user_id;

  if (!ids) throw new MissingQueryParamError("ids");
  if (!user_id) throw new MissingQueryParamError("user_id");

  if (!Array.isArray(ids)) throw new BadQueryParamError("ids", ids);
  if (typeof user_id !== "string") throw new BadQueryParamError("user_id", user_id);

  db.notification.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: {
      read: true,
    },
  });

  return new Response("Marked notifications as read");
});
