import { ContentFrame } from "./frame";

const SERVERS = [
  { name: "edge-01", status: "online", detail: "docker · 12 containers" },
  { name: "api-west", status: "online", detail: "shell idle" },
  { name: "worker-3", status: "building", detail: "deploy v30728" },
] as const;

const LOG_LINES = [
  { t: "12:04:01", msg: "agent connected · edge-01" },
  { t: "12:04:03", msg: "stream open · docker.events" },
  { t: "12:04:08", msg: "deploy started · worker-3" },
  { t: "12:04:14", msg: "health ok · api-west" },
] as const;

export function ConsoleStage() {
  return (
    <section className="relative z-10 py-16 md:py-24" aria-labelledby="console-stage-heading">
      <ContentFrame>
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="console-stage-heading"
            className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            One browser. Your fleet.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Live shell, Docker, and logs without juggling SSH sessions.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-xl bg-foreground text-background shadow-none md:mt-14">
          <div className="flex items-center gap-2 border-b border-background/10 px-4 py-3">
            <span aria-hidden className="size-2.5 rounded-full bg-red-500/80" />
            <span aria-hidden className="size-2.5 rounded-full bg-amber-400/80" />
            <span aria-hidden className="size-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-mono text-xs text-background/50">monrep · console</span>
          </div>
          <div className="grid gap-0 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <ul className="border-b border-background/10 p-4 md:border-r md:border-b-0">
              {SERVERS.map((server) => (
                <li
                  key={server.name}
                  className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-mono text-sm text-background">{server.name}</p>
                    <p className="text-xs text-background/50">{server.detail}</p>
                  </div>
                  <span
                    className={
                      server.status === "building"
                        ? "text-xs font-medium text-primary"
                        : "text-xs font-medium text-emerald-400"
                    }
                  >
                    {server.status}
                  </span>
                </li>
              ))}
            </ul>
            <div className="p-4 font-mono text-xs leading-relaxed">
              {LOG_LINES.map((line) => (
                <p key={line.t} className="text-background/70">
                  <span className="text-primary">{line.t}</span> {line.msg}
                </p>
              ))}
              <p className="mt-2 text-background/40">_</p>
            </div>
          </div>
        </div>
      </ContentFrame>
    </section>
  );
}
