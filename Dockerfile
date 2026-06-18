# Stage 1: build the static Astro site
FROM node:22-alpine AS builder

WORKDIR /app

# Update Alpine packages to patch CVEs
RUN apk update && apk upgrade --no-cache

COPY package.json package-lock.json* .npmrc* ./

RUN npm install --production=false || npm install --production=false

COPY . .

RUN npm run build

# Stage 2: serve static files with Nginx
FROM nginx:1.29-alpine AS runner

# Update Alpine packages to patch CVEs (OpenSSL 3.3.7+)
RUN apk update && apk upgrade --no-cache

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
