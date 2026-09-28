const STEPS = [
  "Run the one-liner on the host",
  "Add server in the console to get an enroll token",
  "Agent connects; live samples appear within seconds",
] as const;

export function InstallSteps() {
  return (
    <ol className="flex list-none flex-col gap-2 text-xs text-muted-foreground">
      {STEPS.map((text, index) => (
        <li key={text} className="flex gap-2">
          <span className="shrink-0 font-mono text-muted-foreground/80">{index + 1}.</span>
          <span>{text}</span>
        </li>
      ))}
    </ol>
  );
}
