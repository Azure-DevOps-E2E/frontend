FROM node:24.19.0-alpine3.24 AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run test:run \
    && npm run build

FROM nginx:1.30.4-alpine3.24

ARG APP_VERSION=1.0.0
ARG APP_IMAGE_TAG=1.0.0
ENV APP_VERSION=${APP_VERSION} \
    APP_IMAGE_TAG=${APP_IMAGE_TAG} \
    NGINX_ENVSUBST_FILTER=APP_VERSION,APP_IMAGE_TAG

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
