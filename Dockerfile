FROM node:21-alpine
LABEL title="ifcloud-core"
LABEL version="1.0"
LABEL maintainer="ifelfi"

RUN apk add --no-cache ffmpeg g++ make py3-pip

WORKDIR /app

COPY . /app
RUN npm install && \
    npm run build

CMD ["npm", "run", "start:prod"]