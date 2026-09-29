import { NumberInput, Separator, Switch } from "@monrep/ui/base";
import { SettingRow } from "./SettingRow";

type MetricsSectionProps = {
  metricsEnabled: boolean;
  metricsIntervalSec: number;
  pending: boolean;
  onMetricsEnabledChange: (enabled: boolean) => void;
  onIntervalChange: (sec: number) => void;
};

export function MetricsSection({
  metricsEnabled,
  metricsIntervalSec,
  pending,
  onMetricsEnabledChange,
  onIntervalChange,
}: MetricsSectionProps) {
  const handleIntervalValueChange = (value?: number) => {
    if (value === undefined || !Number.isFinite(value)) return;
    const next = Math.max(5, Math.min(3600, Math.floor(value)));
    if (next !== metricsIntervalSec) onIntervalChange(next);
  };

  return (
    <section className="pb-4">
      <Separator className="my-4" />
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground">Metrics</h3>
      <SettingRow
        label="Local metrics scrape"
        description="Agent stores timeseries in SQLite on the host (not Cloudflare)"
      >
        <Switch
          checked={metricsEnabled}
          disabled={pending}
          onCheckedChange={onMetricsEnabledChange}
        />
      </SettingRow>
      <SettingRow label="Scrape interval" description="Seconds between host scrapes (min 5)">
        <NumberInput
          min={5}
          max={3600}
          stepper={5}
          disabled={pending || !metricsEnabled}
          value={metricsIntervalSec}
          onValueChange={handleIntervalValueChange}
        />
      </SettingRow>
    </section>
  );
}
