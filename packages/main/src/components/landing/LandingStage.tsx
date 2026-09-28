import { HeroCopy } from "./HeroCopy";
import { InstallPanel } from "./InstallPanel";

export function LandingStage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:items-center">
      <HeroCopy />
      <InstallPanel />
    </div>
  );
}
