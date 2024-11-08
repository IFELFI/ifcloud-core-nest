FROM node:22-alpine AS base

FROM base AS build

WORKDIR /app
COPY . ./
RUN npm install -y && \
  npm run build && \
  npm prune --production

FROM base AS production
WORKDIR /app
RUN rm -rf ./*
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/tsconfig.json ./

ENV NODE_ENV=production

ENTRYPOINT ["node", "dist/main.js"]
