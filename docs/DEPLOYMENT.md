# Deployment

Runbook for deploying this app to a VM (EC2 or equivalent) with Docker Compose. For local development, see [QUICKSTART.md](QUICKSTART.md) instead — this document is for a real, internet-reachable deployment.

## Architecture

```
Browser
  │  HTTPS (or HTTP, see the TLS section)
  ▼
nginx on the host (systemd, ports 80/443)  ─┐
  │  proxy_pass                              │  This layer is OPTIONAL but strongly
  ▼                                          │  recommended — see "Why a host-level
frontend container (nginx, port 8080)  ──────┘  reverse proxy" below.
  │  proxy_pass /api/, /socket.io/
  ▼
backend container (Node/Express, port 9999)
  │
  ▼
MongoDB (Atlas, or self-hosted — not part of this compose file)
```

`docker-compose.yml` only defines `backend` and `frontend`. MongoDB is expected to be external (Atlas is what this project has used).

### Why a host-level reverse proxy

The frontend container's nginx (built from `frontend/Dockerfile`) runs unprivileged and can't bind port 80/443 — it listens on 8080. You have two options for the public-facing port:

1. **Publish 8080 directly** (`docker-compose.yml`'s default: `ports: ["8080:8080"]`) and let people hit `:8080`. Simplest, but no TLS termination point, and you're relying on the container's nginx as the sole internet-facing layer.
2. **Put a host-level nginx (or another reverse proxy / load balancer) in front on 80/443**, proxying to the container's 8080 (and to the backend's 9999 for `/api/` and `/socket.io/`, or just to 8080 and let the container's own nginx re-proxy those internally). This is what lets you terminate TLS with a normal domain + Let's Encrypt cert, and it's the recommended setup for anything beyond local testing.

If you go with option 2, a minimal host nginx server block:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;  # or `_` to match any Host header, e.g. a bare IP

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;  # backend's `trust proxy` reads this
    }

    location /api/ {
        proxy_pass http://localhost:9999;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then run `sudo certbot --nginx` — it detects this server block, provisions a cert for `server_name`, and rewrites the file to add a `listen 443 ssl` block plus an HTTP→HTTPS redirect. After that, only `443` needs to be reachable publicly (keep `80` open too — certbot's renewal and the redirect both need it).

**Only forward `/api/`** if you skip the container-nginx hop for API calls; if you proxy everything (including `/api/`) to `localhost:8080`, the container's own nginx (`frontend/nginx.conf`) re-proxies `/api/` and `/socket.io/` to the backend for you — both layouts work, pick one and be consistent about which port each `location` targets.

## Required environment variables

Set these in a `.env` file at the repo root (same directory as `docker-compose.yml` — Compose reads it automatically for both `${VAR}` interpolation in the compose file and, via `env_file:`, for direct injection into the backend container).

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | Yes | Full connection string, including credentials |
| `JWT_SECRET` | Yes | ≥32 random characters. **The backend refuses to start** without this — see the `JWT_SECRET_PLACEHOLDERS` check in `server.js`. Generate with `openssl rand -base64 48`. Rotating it signs out every existing session. |
| `FRONTEND_URL` | Yes | The exact origin the browser will use — `https://your-domain.com` or `http://<ip>` (no trailing slash, no path). This is the only CORS-approved origin. **`docker-compose.yml` refuses to start without it** (`${FRONTEND_URL:?...}`) — there is deliberately no fallback, since a stale default here is a real exposure, not a cosmetic bug. |
| `COOKIE_SECURE` | No | Leave unset for any HTTPS deployment (the default is `Secure; SameSite=None`). Set to the literal string `false` **only** for a same-origin plain-HTTP deployment with no TLS in front — see the comment in `backend/src/routes/auth.js`. Never set this behind TLS. |
| `OPENAI_API_KEY` | No | Only needed for the AI features (suggestions, improve). The app runs fine without it; those specific endpoints will fail. |
| `PORT` | No | Backend port inside the container. Defaults to `9999`, and the frontend's nginx config, the Vite dev proxy, and `docker-compose.yml` all assume `9999` — don't change it without updating all three. |
| `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY` | No | Only relevant if you mount `routes/jira.js` in `server.js` — it's currently commented out (see [ARCHITECTURE.md](ARCHITECTURE.md#known-gaps)). |

`.env.example` documents all of these with placeholders — `cp .env.example .env` and fill in real values, never commit the result.

## Standard deploy

```bash
git pull
docker compose up -d --build
```

That's the whole flow once the host is set up. `env_file:`/`environment:` values are read at **container creation**, not live — after changing `.env`, `docker compose up -d` (not `restart`) is required to pick up the new values. `docker compose down && docker compose up -d` guarantees a clean recreate if you're unsure.

### Verifying it worked

```bash
docker compose ps                                    # both services "Up"
docker compose logs backend --tail 20                # look for "MongoDB Connected" and no FATAL line
curl -s http://localhost:9999/health                  # {"status":"OK","db":"connected"}
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/   # 200
```

Then test in an actual browser at the public URL: register an account, refresh the page, confirm you're still logged in. This is the real end-to-end check — it's the only step that proves the cookie (`Secure`/`SameSite` settings, `FRONTEND_URL` matching the actual origin, CORS) is configured correctly together, not just that each container independently boots.

## Troubleshooting

**`unknown shorthand flag: 'd' in -d` when running `docker compose up -d`**
Docker Compose V2 isn't installed as a CLI plugin — the base `docker` CLI is trying (and failing) to parse `compose` as something else. Install it:
```bash
mkdir -p ~/.docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose
```

**`compose build requires buildx 0.17.0 or later`**
Either run with `COMPOSE_BAKE=false docker compose up -d --build` (reverts to the legacy build path), or upgrade `buildx`:
```bash
mkdir -p ~/.docker/cli-plugins
ARCH=$(uname -m); case "$ARCH" in x86_64) BX=amd64;; aarch64) BX=arm64;; esac
BXV=$(curl -s https://api.github.com/repos/docker/buildx/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
curl -SL "https://github.com/docker/buildx/releases/download/${BXV}/buildx-${BXV}.linux-${BX}" -o ~/.docker/cli-plugins/docker-buildx
chmod +x ~/.docker/cli-plugins/docker-buildx
```

**Backend logs `❌ FATAL: JWT_SECRET is missing, too short, or set to a known placeholder`**
`.env` either doesn't have `JWT_SECRET` set, or it's still the old default. Set a real one (see the table above) and `docker compose up -d` again.

**`docker compose` itself refuses to run, citing `FRONTEND_URL`**
Same idea — it's a required variable with no default. Set it in `.env`.

**Login returns 200, but the very next request looks logged-out (or the page bounces back to `/login` after a refresh)**
The session cookie has `Secure` set but the app is being served over plain HTTP — browsers silently refuse to store a `Secure` cookie without HTTPS. Either put TLS in front (recommended — see the reverse-proxy section above), or set `COOKIE_SECURE=false` for same-origin HTTP testing only.

**CORS error in the browser console**
`FRONTEND_URL` doesn't exactly match the origin in the address bar — check for a missing/extra port, `http` vs `https`, or a trailing slash.

**MongoDB connection times out after moving/restarting the VM**
The instance's public IP almost always changes on stop/start (unless an Elastic IP is attached). Get the current IP (`curl -s https://checkip.amazonaws.com` from the instance) and add it to MongoDB Atlas → Network Access. Also confirm the Atlas cluster itself isn't paused.

**`docker ps -a` shows containers you didn't expect, or requests to a bare IP serve something that isn't this app**
Check for a *host-level* web server (nginx, Apache) independent of Docker — `sudo ss -tlnp` lists everything actually listening, with the owning process. A previous non-Docker deployment (e.g. nginx serving a statically-built `frontend/dist` directly, proxying `/api/` to a bare `node`/`pm2` process) can coexist with a newer Docker-based one and silently win if it's bound to the port you're testing.

## Rotating secrets

- **`JWT_SECRET`**: generate a new value, update `.env`, `docker compose up -d`. Every existing session is invalidated — expected, not a bug.
- **`OPENAI_API_KEY`**: revoke the old key at platform.openai.com first, *then* replace it in `.env`. Replacing the local value alone doesn't revoke the old key — if it leaked (e.g. was ever committed to git), it stays usable and billable until explicitly revoked on the OpenAI side.
- **MongoDB credentials**: rotate via Atlas (create a new DB user, update `MONGODB_URI`, verify connectivity, then delete the old user) rather than reusing the same password.
