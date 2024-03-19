FROM node:18-alpine AS base

WORKDIR /app

COPY . . 
RUN npm install -g forever
RUN npm install
RUN mkdir /app/temp
VOLUME /app/temp

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 service

USER service

ARG APP_NAME
ENV APP_NAME ${APP_NAME:-MangaJS}

ARG HTTP_PORT
ENV HTTP_PORT ${HTTP_PORT:-80}

ARG IO_PORT
ENV IO_PORT ${IO_PORT:-8001}

ARG IO_AUTH_USERNAME
ENV IO_AUTH_USERNAME ${IO_AUTH_USERNAME:-root}

ARG IO_AUTH_PASSWORD
ENV IO_AUTH_PASSWORD ${IO_AUTH_PASSWORD:-1q2w3e$R$E#Q!###@@}

ARG INITIAL_DATA
ENV INITIAL_DATA ${INITIAL_DATA:-/app/temp/initialData.json}

ARG AUTO_SAVE_FREQUENCY
ENV AUTO_SAVE_FREQUENCY ${AUTO_SAVE_FREQUENCY:-60}

ARG HIDE_PANEL
ENV HIDE_PANEL ${HIDE_PANEL:-true}

ARG USE_TEMP_DATA
ENV USE_TEMP_DATA ${USE_TEMP_DATA:-true}

EXPOSE ${HTTP_PORT}
EXPOSE ${IO_PORT}

CMD ["npm", "start", "server"]
