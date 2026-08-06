# Build stage
#
# Pinned to a specific patch release rather than the floating `node:18-alpine`
# tag, so a rebuild does not silently pick up a different base image.
FROM node:18.20.8-alpine AS build

WORKDIR /usr/src/app

# The build needs devDependencies (Vite and friends) to produce the bundle, so
# no --omit=dev here. `npm ci` is not usable either: compose builds with
# `context: ./frontend`, and the lockfile for this workspaces monorepo lives at
# the repository root, outside that context.
COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Serve stage
#
# nginx-unprivileged is the same nginx built to run entirely as a non-root user
# (uid 101). The stock nginx image runs its workers as `nginx` but keeps the
# master process as root so it can bind port 80; this variant has no root
# process at all, and listens on 8080 because ports below 1024 need privileges.
FROM nginxinc/nginx-unprivileged:1.27-alpine

# Both the config and the static files are read by the unprivileged user.
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build --chown=nginx:nginx /usr/src/app/dist /usr/share/nginx/html

# 8080, not 80 — see the note on the base image above. docker-compose maps the
# published port to this.
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
