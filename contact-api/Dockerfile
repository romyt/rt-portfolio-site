FROM node:22-alpine AS builder

WORKDIR /app

# Update Alpine packages to patch CVEs
RUN apk update && apk upgrade --no-cache

COPY package.json package-lock.json* ./
RUN npm install --production

FROM node:22-alpine AS runner

WORKDIR /app

# Update Alpine packages to patch CVEs (OpenSSL 3.5.6+)
RUN apk update && apk upgrade --no-cache

# Copy dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./

# Run as non-root user
USER node

EXPOSE 3000

CMD ["node", "server.js"]
