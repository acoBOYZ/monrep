import { useState } from "react";
import { SaveIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, Input } from "@monrep/ui/base";
import { SettingRow } from "./SettingRow";
import type { ChangeEvent, SubmitEvent } from "react";

type AgentPreferenceSectionProps = {
  serverName: string;
  pending?: boolean;
  onServerNameChange: (name: string) => void;
};

export function AgentPreferenceSection({
  serverName,
  pending = false,
  onServerNameChange,
}: AgentPreferenceSectionProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const name = draft ?? serverName;
  const dirty = draft !== null && draft.trim() !== serverName;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
  };

  const handleSave = () => {
    const next = name.trim();
    if (!next || next === serverName) {
      setDraft(null);
      return;
    }
    onServerNameChange(next);
    setDraft(null);
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dirty || pending) return;
    handleSave();
  };

  return (
    <section>
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground">Preferences</h3>
      <SettingRow label="Server name" description="Display name for this agent in the fleet">
        <form className="flex items-center gap-2" onSubmit={handleSubmit}>
          <Input value={name} onChange={handleChange} disabled={pending} className="h-8 w-40" />
          <Button type="submit" variant="outline" size="sm" disabled={!dirty || pending}>
            <HugeiconsIcon icon={SaveIcon} className="size-4" aria-hidden />
            Save
          </Button>
        </form>
      </SettingRow>
    </section>
  );
}
