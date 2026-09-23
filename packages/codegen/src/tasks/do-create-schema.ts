import { writeIfChanged } from "../lib/emit";
import { paths } from "../paths";

export async function runDoCreateSchema(): Promise<void> {
  const template = await Bun.file(paths.createDoModuleTemplate).text();
  await writeIfChanged(paths.dbDoCreateModule, template, "doCreateSchema");
}
