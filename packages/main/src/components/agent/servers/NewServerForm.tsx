import { Alert, AlertContent, AlertDescription, Button, Input, Label } from "@monrep/ui/base";
import type { SubmitEvent } from "react";

type NewServerFormProps = {
  name: string;
  pending: boolean;
  error: string | null;
  onNameChange: (value: string) => void;
  onSubmit: (event: SubmitEvent) => void;
};

export function NewServerForm({
  name,
  pending,
  error,
  onNameChange,
  onSubmit,
}: NewServerFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="server-name">Server name</Label>
        <Input
          id="server-name"
          required
          maxLength={120}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="prod-edge-1"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Mints a one-time enroll token for the host agent.
        </p>
      </div>
      {error ? (
        <Alert variant="destructive" appearance="light">
          <AlertContent>
            <AlertDescription>{error}</AlertDescription>
          </AlertContent>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending || name.trim().length === 0}>
        {pending ? "Creating…" : "Create & mint token"}
      </Button>
    </form>
  );
}
