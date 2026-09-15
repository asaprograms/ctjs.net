import { route } from "app/api";

import { getStats } from ".";

export const GET = route(async () => {
  const stats = await getStats();
  return Response.json({
    module_count: stats.moduleCount,
    release_count: stats.releaseCount,
    total_imports: stats.totalImports,
  });
});
