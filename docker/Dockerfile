FROM node:18-alpine AS base

WORKDIR /app

RUN apk add --no-cache git
RUN git clone https://github.com/state-machine-solutions/manga-js-server.git ./
RUN npm install -g forever
RUN npm install
RUN mkdir /app/temp
VOLUME /app/temp

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 service

USER service

ARG APP_NAME
ENV APP_NAME Example

ARG HTTP_PORT
ENV HTTP_PORT 80 

ARG IO_PORT
ENV IO_PORT 8001

ARG IO_AUTH_USERNAME
ENV IO_AUTH_USERNAME root

ARG IO_AUTH_PASSWORD
ENV IO_AUTH_PASSWORD fdlpksjafj3434fdfdas###@@

ARG INITIAL_DATA
ENV INITIAL_DATA /app/temp/initialData.json

ARG AUTO_SAVE_FREQUENCE
ENV AUTO_SAVE_FREQUENCE 5

ARG HIDE_PANEL
ENV HIDE_PANEL true

ARG USE_TEMP_DATA
ENV USE_TEMP_DATA true

EXPOSE 80
EXPOSE 8001

CMD ["npm", "start", "server"]
