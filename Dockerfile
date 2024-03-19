FROM node:21-alpine
LABEL title="ifcloud-core"
LABEL version="1.0"
LABEL maintainer="ifelfi"

RUN apk add --no-cache ffmpeg
RUN apk add g++ make py3-pip

WORKDIR /app

COPY . /app
RUN npm install
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]