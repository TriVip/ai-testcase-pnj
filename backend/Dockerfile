# Pinned to a specific patch release rather than the floating `node:18-alpine`
# tag, so a rebuild does not silently pick up a different base image. Pinning by
# digest (node:18.20.8-alpine@sha256:...) would be stronger still.
FROM node:18.20.8-alpine

# The node:alpine images ship an unprivileged `node` user (uid 1000). Create the
# working directory as root and hand it over, so everything below runs as that
# user instead of root.
WORKDIR /usr/src/app
RUN chown node:node /usr/src/app

USER node

# Dependencies first, so the layer is reused when only source changes.
#
# `npm install` rather than `npm ci`: compose builds this image with
# `context: ./backend`, and the lockfile for this workspaces monorepo lives at
# the repository root, outside that context. Moving to `npm ci` means moving the
# build context to the root — worth doing, but it changes how the image is built
# and belongs in its own change.
COPY --chown=node:node package*.json ./
RUN npm install --omit=dev

COPY --chown=node:node . .

# Informational only. The server listens on process.env.PORT, and 9999 is what
# compose, the Vite dev proxy and .env.example all use. This said 5000 before,
# which matched nothing.
EXPOSE 9999

CMD ["npm", "start"]
