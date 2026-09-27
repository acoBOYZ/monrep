type PlaygroundLiveStatusProps = {
  isReady: boolean;
  hourBucket: string;
};

/** Shared live / hour-bucket strip for playground stream demos. */
export function PlaygroundLiveStatus({ isReady, hourBucket }: PlaygroundLiveStatusProps) {
  return (
    <dl className="flex gap-3 text-xs text-muted-foreground">
      <div>
        <dt className="sr-only">Stream</dt>
        <dd>{isReady ? "live" : "connecting"}</dd>
      </div>
      <div>
        <dt className="sr-only">UTC hour</dt>
        <dd className="font-mono text-cool">{hourBucket}</dd>
      </div>
    </dl>
  );
}
