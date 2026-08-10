# Scaling & Shared State (F14)

This document records the **per-process / in-memory state** in the backend that
is **not shared** across multiple backend instances, the **safe operating
assumption** today, and the **recommended path** to horizontal scaling.

> Status: **Documentation only.** No Redis, no new dependencies, and no
> `docker-compose` changes are introduced by F14. Any move to shared state
> requires adding dependencies and running Redis, which is **deferred and must
> be approved separately**.

---

## 1. Per-instance state that is NOT shared across backend instances

Each item below lives in a single Node.js process's heap. Running more than one
backend instance (PM2 cluster, multiple containers, autoscaling) causes the
behavior described.

### Rate limiter — `backend/src/middleware/rateLimit.js` (F6)
- In-memory `Map` of counters keyed by identity + endpoint path.
- Each instance keeps its own counters, so the **effective limit becomes
  `max * instanceCount`** across instances.
- Counters **reset on restart** and expire per the configured window.
- Intended as a best-effort, per-process brute-force / cost-abuse guard.

### Server-side script store — `backend/src/services/scriptStore.js` (F5)
- In-memory `Map` keyed by `scriptId`, with a **30-minute TTL** per entry.
- `POST /automation/generate` stores a script on the instance that handled it;
  a later `POST /automation/run` routed to a **different instance** will
  **not find the `scriptId`** and will fail the lookup.
- Entries are **lost on restart** (do not survive process restarts).

### Runner concurrency semaphore — `backend/src/services/playwrightRunner.js` (F7)
- A per-process semaphore (`MAX_CONCURRENT_RUNS`, currently `2`) gates how many
  Playwright Docker containers spawn at once.
- The limit is **per process**, so **total host concurrency =
  `MAX_CONCURRENT_RUNS * instanceCount`**.
- There is no cross-instance / global concurrency bound.

### Socket.io real-time events — `backend/src/server.js`
- A single `Server` instance with room support (`joinRoom` / `leaveRoom`) and
  `req.io` injected into routes for emitting events (e.g. real-time test-case /
  test-plan status updates).
- There is **no shared adapter**, so events emitted from one instance
  **will not reach clients connected to another instance**. A client in a room
  on instance A misses events emitted on instance B.

---

## 2. Current safe operating assumption

The application is correct **as long as it runs as a SINGLE backend instance
(single process)**. All of the state above is coherent within one process.

Sticky sessions (load-balancer session affinity) **do not fully solve** the
cross-instance problems:
- They can keep a given client pinned to one instance, but the
  **generate → run** flow and **Socket.io event delivery** still break when
  the two related requests or the emitting instance differ from the client's
  pinned instance, and shared limits/concurrency still fragment per process.

Until shared state is introduced, deploy the backend as a single instance.

---

## 3. Recommended path to horizontal scaling (not implemented)

The following are the recommended changes to safely run multiple backend
instances. **None of these are implemented here.** They require adding
dependencies and running Redis (a `docker-compose` service), which is deferred
and must be approved separately.

- **Redis-backed rate limiting** — move rate-limit counters to Redis so limits
  are shared (global) across all instances instead of `max * instanceCount`.
- **Shared script store** — store generated scripts in Redis with TTL so
  `generate` and `run` can be handled by **any** instance.
- **Socket.io Redis adapter** (`@socket.io/redis-adapter`) — for cross-instance
  event delivery so room events reach clients regardless of which instance is
  connected or emitting.
- **Cross-instance concurrency limit** — a Redis-based queue/lock (or dedicated
  job queue) if the **global** Playwright run concurrency must be bounded across
  instances, rather than per process.

Each of these adds a runtime dependency on Redis and new npm packages, so they
are intentionally out of scope for the minimal F14 fix.

---

## 4. Cross-references

The scaling caveats above are also documented inline in the code:

| Finding | File | Inline note |
| --- | --- | --- |
| F5 | `backend/src/services/scriptStore.js` | "SCALING CAVEAT (ties into F14)" — in-memory Map, cross-instance lookup miss, lost on restart |
| F6 | `backend/src/middleware/rateLimit.js` | "SCALING CAVEAT (F14)" — per-process counters, effective limit `max * numberOfInstances` |
| F7 | `backend/src/services/playwrightRunner.js` | "SCALING CAVEAT (ties into F14)" — per-process semaphore, total concurrency `MAX_CONCURRENT_RUNS * instanceCount` |
| Socket.io | `backend/src/server.js` | Single `Server` with rooms, no shared adapter — events do not cross instances |

_Requirements: F14_
