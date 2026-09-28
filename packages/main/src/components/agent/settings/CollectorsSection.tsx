import { Separator, Switch } from "@monrep/ui/base";
import { CollectorCard } from "./CollectorCard";
import { SettingRow } from "./SettingRow";
import type { CollectorSpec } from "./CollectorCard";
import type { CollectorsMap } from "@/server/agent/schemas";

type CollectorsSectionProps = {
  collectors: CollectorsMap;
  backgroundEnabled: boolean;
  pending: boolean;
  onBackgroundEnabledChange: (enabled: boolean) => void;
  onCollectorChange: (name: string, spec: CollectorsMap[string]) => void;
};

export function CollectorsSection({
  collectors,
  backgroundEnabled,
  pending,
  onBackgroundEnabledChange,
  onCollectorChange,
}: CollectorsSectionProps) {
  const names = Object.keys(collectors).sort();

  return (
    <section className="pb-4">
      <Separator className="my-4" />
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground">Collectors</h3>
      <SettingRow
        label="Background collectors"
        description="Run the collectors below on their intervals"
      >
        <Switch
          checked={backgroundEnabled}
          disabled={pending}
          onCheckedChange={onBackgroundEnabledChange}
        />
      </SettingRow>
      <div className="flex flex-col gap-2">
        {names.map((name) => (
          <CollectorSectionRow
            key={name}
            name={name}
            spec={collectors[name]!}
            disabled={!backgroundEnabled || pending}
            onCollectorChange={onCollectorChange}
          />
        ))}
      </div>
    </section>
  );
}

type CollectorSectionRowProps = {
  name: string;
  spec: CollectorSpec;
  disabled: boolean;
  onCollectorChange: CollectorsSectionProps["onCollectorChange"];
};

const CollectorSectionRow = ({
  name,
  spec,
  disabled,
  onCollectorChange,
}: CollectorSectionRowProps) => {
  const handleCollectorChange = (next: CollectorSpec) => {
    onCollectorChange(name, next);
  };

  return (
    <CollectorCard
      key={name}
      name={name}
      spec={spec}
      disabled={disabled}
      onChange={handleCollectorChange}
    />
  );
};
