# Stage 1: build the static Astro site
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* .npmrc* ./

RUN npm install --production=false || npm install --production=false

COPY . .

RUN npm run build

# Stage 2: serve static files with Nginx
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
