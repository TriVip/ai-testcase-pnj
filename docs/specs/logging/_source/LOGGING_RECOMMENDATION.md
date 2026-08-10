# Logging Recommendation (F26)

Status: **Deferred** — this is a recommendation only. Adopting it requires adding a
dependency and explicit approval. No logger has been installed and no `console.*`
calls have been rewritten as part of this task.

## Current state

The backend logs with scattered `console.log` / `console.error` calls. This produces
unstructured, plain-text output that is hard to filter, aggregate, or search once the
service runs in a real environment, and it offers no log levels or field redaction.

## Recommendation

Adopt a structured logger. [pino](https://github.com/pinojs/pino) is a good fit for
this Node/Express codebase:

- **JSON logs** — machine-parseable output for aggregation and search.
- **Log levels** — `trace`/`debug`/`info`/`warn`/`error`/`fatal`, controlled via an
  env var (e.g. `LOG_LEVEL`) so verbosity differs between dev and prod.
- **Request logging middleware** — use [pino-http](https://github.com/pinojs/pino-http)
  to log each HTTP request/response with a correlation id, method, path, status, and
  latency.
- **Redaction of sensitive fields** — configure pino `redact` paths to strip secrets
  and PII from logs (e.g. `req.headers.authorization`, `req.headers.cookie`, password
  and token fields, API keys).
- **Replace scattered `console.log` / `console.error`** — route all logging through a
  single shared logger instance so format and level handling are consistent.

## Migration outline (when approved)

1. Add `pino` and `pino-http` as dependencies (requires approval per the dependency
   policy — see `DEPENDENCY_REMEDIATION.md`), then run `npm install`.
2. Create a shared logger module (e.g. `backend/src/config/logger.js`) exporting a
   configured pino instance with `level` from `LOG_LEVEL` and a `redact` list.
3. Wire `pino-http` into the Express app early in the middleware chain in `server.js`.
4. Replace `console.log` / `console.error` call sites with the shared logger.
5. In development, optionally pipe through `pino-pretty` for human-readable output.

## Note on unused OAuth env vars

The `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` variables in
`.env.example` are currently **unused** — the Google OAuth passport strategy was dead
code and has been removed (F26). The env vars are left in place to document a possible
future OAuth integration.
