# Roadmap

Living checklist for monrep. Check things off when they ship. Order can change — that’s fine.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Shipped

Control plane (auth, server list/detail, revoke) · enroll / outbound WSS · dumb agent `run`/`cancel` + PTY · collectors + samples · TanStack Charts health dashboard · install one-liner + GitHub release binary + agent self-update · entity Docker/Services panels (list → logs / lifecycle) · server glance counts · kill switch (stop running containers). Playground UI and `testm` DO module removed. Console UI refresh: machine-readable default collectors, per-run metrics model, TanStack Charts fleet/server dashboards with range tabs and shared-element chart expand, rebuilt settings sheet, pending-server enroll steps, non-nested Docker/Services routes.

---

## Next

1. [x] **Entity Docker panel** — list containers as rows; status/ports; Logs / Restart / Stop / Start; link to PTY
2. [x] **Entity Services panel** — systemd units as rows (failed first); status + journal tail + start/stop/restart
3. [x] **Server glance** — failed/unhealthy counts on `/servers/$id` with deep-links into Docker / Services
4. [x] **Kill switch** — danger UX: emergency stop of running containers (not mass systemd); Worker `run` argv
5. [ ] **Deploy trigger** — thin helper (pull/restart via `run`) after entity panels feel good

Agent stays dumb (PTY + generic `run`). Helpers are Worker/UI convenience.

---

## How we use this file

1. When you finish something, flip `[ ]` → `[x]` (or `[~]` while it’s half done).
2. New big ideas go in **Next**. Don’t invent a second roadmap.
3. README stays the pitch; **this file stays the truth of progress**.

Last intent: deploy trigger next; agent stays dumb.
