# Base image
FROM node:22.14.0-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /opt/app
COPY . .

# Install prod dependencies
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Install all dependencies
FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
# possible test cmds
RUN pnpm build

# Output image
FROM nginx
COPY nginx.base.conf /etc/nginx/nginx.conf
COPY nginx.default.conf /etc/nginx/nginx.conf.d/default.conf
COPY --from=build /opt/app/dist /usr/share/nginx/html
