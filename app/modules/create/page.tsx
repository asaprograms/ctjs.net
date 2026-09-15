import { getTags } from "app/api/tags";

import CreateModuleComponent from "./CreateModuleComponent";

export default async function Page() {
  const tags = await getTags();
  return <CreateModuleComponent availableTags={[...tags]} />;
}
