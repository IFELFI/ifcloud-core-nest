FROM node:22-alpine as build

LABEL title="ifauth-member-manager"
LABEL version="1.3.2"
LABEL maintainer="ifelfi"

WORKDIR /app
COPY . ./
RUN npm install -y && \
    npm run build && \
    npm prune --production

FROM node:22-alpine as deploy

WORKDIR /app
RUN rm -rf ./*
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/tsconfig.json ./

ENTRYPOINT ["npm", "start"]