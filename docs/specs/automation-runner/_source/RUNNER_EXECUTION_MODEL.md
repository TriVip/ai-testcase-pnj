# Runner Execution Model (F8 — Runner Isolation)

Status: 🟠 INFRA — documentation + verification. Any change touching Docker/infra
is the operator's to review and apply. This document does not change behavior.

Related findings:
- **F3** — sandbox hardening of the Playwright container (network, resource
  limits, capability drop, non-root, read-only). See
  `backend/src/services/playwrightRunner.js` and the `DOCKER-USER` egress rules
  documented there (`SANDBOX_HOST_FIREWALL_SETUP`).
- **F5 / F7** — only server-side stored scripts run; concurrency is bounded.

---

## 1. The execution model (what actually happens)

The request-handling **backend** (Express API) does not run untrusted scripts
in-process. When a test run is requested, the backend **shells out to the host's
`docker` CLI** (`child_process.exec` in `playwrightRunner.js`) to spawn a
**short-lived, hardened Playwright container** for that single run. The
untrusted AI/user-provided Playwright script executes only inside that isolated
container, never inside the backend process.

Key properties:

- The backend calls `docker run ...` against the **host Docker daemon**. It talks
  to the daemon through the host's Docker CLI/socket at the host level.
- The backend does **NOT** mount `/var/run/docker.sock` into a container that
  processes user input.
- The backend does **NOT** run with `privileged: true`.
- Each run gets a fresh container that is removed on exit (`--rm`).
- The untrusted script runs with hardening from F3: dedicated bridge network
  (not the default bridge), `--memory`, `--cpus`, `--pids-limit`,
  `--cap-drop=ALL`, `--security-opt no-new-privileges`, non-root `pwuser`,
  `--read-only` root filesystem + `tmpfs /tmp`.

### Current deployment reality

`docker-compose.yml` defines two services, `backend` and `frontend`. The
`backend` service is **not** given the Docker socket and is **not** privileged.
Because the backend needs a Docker daemon at runtime to launch runner
containers, the current model implies the backend runs where a Docker daemon is
reachable on the host (for example, the backend running directly on the host, or
on a host that provides Docker access). This is the ambiguity F8 asks to make
explicit: **the runner depends on host Docker, and that dependency must be
provided without handing the user-facing backend root-equivalent access to the
host daemon.**

---

## 2. Security rationale (why docker.sock is prohibited here)

Mounting `/var/run/docker.sock` into a container grants that container full
control of the host Docker daemon. Anyone who can talk to the daemon can start a
new container that bind-mounts the host root filesystem and runs as root —
i.e. it is effectively **root on the host** and a trivial container escape.

The backend is the component that receives and processes untrusted input
(AI-generated / user-supplied Playwright scripts, request bodies). Giving that
component the Docker socket would mean a bug or injection in request handling
could escalate straight to host takeover. Therefore:

- Requests are handled by the backend.
- The untrusted script runs in a **separate, isolated, capability-dropped,
  resource-limited** container (F3).
- The socket is never exposed to the request-handling backend.

---

## 3. Recommended deployment

If the backend must run **inside a container** and still needs to launch sibling
runner containers, do **not** solve it by mounting `docker.sock` into the
user-facing backend. Preferred options, in order:

1. **Separate host / VM for runs.** Run untrusted containers on a dedicated,
   access-controlled host or VM, isolated from the app host and its credentials
   (cloud metadata, DB, secrets). Strongest blast-radius reduction.
2. **Dedicated, access-controlled runner service.** Put a thin runner service
   between the backend and the daemon. The backend sends a minimal, validated
   "run script X" request to the runner over an internal, authenticated channel;
   only the runner (not the user-facing backend) is allowed to spawn containers.
   This keeps daemon access off the request-handling surface.
3. **Rootless / sandboxed Docker.** If sibling containers must be launched from
   the same host, prefer rootless Docker or an equivalently sandboxed daemon so
   daemon compromise does not equal host root.

In all cases, keep the **F3 hardening** on the runner container and apply the
**`DOCKER-USER` egress firewall** (block cloud metadata `169.254.169.254`,
link-local, and RFC1918 ranges) documented in `playwrightRunner.js`
(`SANDBOX_HOST_FIREWALL_SETUP`). The rotation/infra actions themselves remain
the operator's to apply and approve.

---

## 4. Hard rules checklist (do NOT violate)

- [ ] **Do NOT** add `- /var/run/docker.sock:/var/run/docker.sock` to the
  `backend` service (or any container that processes user input).
- [ ] **Do NOT** run the backend with `privileged: true`.
- [ ] **Do NOT** grant the user-facing backend root-equivalent access to the
  host Docker daemon by any other means (e.g. adding it to the `docker` group
  inside a shared container, exposing the daemon TCP socket without mTLS/authz).
- [ ] **Keep** the F3 hardening flags on every runner container
  (`--cap-drop=ALL`, `--security-opt no-new-privileges`, non-root, `--read-only`,
  resource limits, dedicated network).
- [ ] **Apply** the `DOCKER-USER` egress rules on the Docker host so the runner
  cannot reach the metadata endpoint or internal networks.

---

## 5. Verification snapshot (as of this task)

Checked the repository for socket mounts and privileged access:

- `grep` for `docker.sock` / `/var/run/docker` / `privileged` across the repo:
  **no matches**.
- `docker-compose.yml`: `backend` and `frontend` services only. Backend has
  **no** socket mount and **no** `privileged: true`.
- `backend/Dockerfile` / `frontend/Dockerfile`: no socket mount, no privileged
  daemon access.

Result: **PASS** — no `docker.sock` is mounted into the request-handling
backend, and nothing runs privileged. No prohibited configuration found.
