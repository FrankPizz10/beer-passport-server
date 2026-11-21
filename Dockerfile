# Start your image with a node base image
FROM node:lts-alpine

# The /app directory should act as the main application directory
WORKDIR /beer-passport-server

# Copy the app package and package-lock.json file
COPY package*.json ./
COPY tsconfig.json ./
COPY context.ts ./
COPY .babelrc ./

# SECURITY (P0.2): no .env file is copied into this image, and .dockerignore
# excludes .env from the build context. Previous images baked the build
# machine's .env into a layer via `COPY .env ./`; those images must be
# treated as containing exposed secrets (rotation is a separate, tracked
# decision). Runtime configuration comes from the environment and from AWS
# Secrets Manager via src/Environment/environmentVariablesClient.js, which
# start:prod already runs first.

# Copy local directories to the current local directory of our docker image (/app)
COPY ./src ./src
COPY ./prisma ./prisma
COPY ./data ./data

# Install node packages and build the app.
# `npm ci` installs exactly what package-lock.json pins.
# `npm run build` is a plain `npx tsc`: it needs no secrets. The Sentry
# sourcemap inject/upload step (npm run sentry:sourcemapsProd, part of
# build:prod) is deliberately NOT run during the image build, because it
# needs the Sentry auth token. Run it at release time, outside the image
# build, with the token supplied by the release environment, for example:
#   SENTRY_AUTH_TOKEN=<token> npm run build:prod
# (build:prod is unchanged and still works for the existing manual flow;
# whether it stays or is replaced is Frank's decision, tracked in the
# Phase 0 plan.)
RUN npm ci\
    && npm run build

EXPOSE 3000

# Start the app
CMD [ "npm", "run", "start:prod" ]
