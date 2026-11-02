# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src/ src/
COPY public/ public/
COPY tests/ tests/
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm test && npm run build

FROM nginx:stable-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=6 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
