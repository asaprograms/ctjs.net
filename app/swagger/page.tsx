import * as fs from "node:fs/promises";

import SwaggerComponent from "./SwaggerComponent";

export default async () => {
  const spec = await fs.readFile("public/swagger.yaml");
  return <SwaggerComponent spec={spec.toString("utf-8")} />;
};
