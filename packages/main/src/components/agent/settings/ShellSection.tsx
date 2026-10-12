import { useState } from "react";
import { SaveIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, Input } from "@monrep/ui/base";
import { SettingRow } from "./SettingRow";
import type { ChangeEvent, SubmitEvent } from "react";

type ShellSectionProps = {
  ptyCwd: string;
  pending?: boolean;
  onPtyCwdChange: (cwd: string) => void;
};

export function ShellSection({ ptyCwd, pending = false, onPtyCwdChange }: ShellSectionProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? ptyCwd;
  const dirty = draft !== null && draft.trim() !== ptyCwd;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
  };

  const handleSave = () => {
    const next = value.trim();
    onPtyCwdChange(next);
    setDraft(null);
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dirty || pending) return;
    handleSave();
  };

  return (
    <section className="pb-4">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground">Shell</h3>
      <SettingRow
        label="Start directory"
        description="Absolute path for new terminals (e.g. /home/aco). Empty = agent default."
      >
        <form className="flex items-center gap-2" onSubmit={handleSubmit}>
          <Input
            value={value}
            onChange={handleChange}
            disabled={pending}
            placeholder="/home/…"
            className="h-8 w-44 font-mono text-xs"
            spellCheck={false}
          />
          <Button type="submit" variant="outline" size="sm" disabled={!dirty || pending}>
            <HugeiconsIcon icon={SaveIcon} className="size-4" aria-hidden />
            Save
          </Button>
        </form>
      </SettingRow>
    </section>
  );
}
