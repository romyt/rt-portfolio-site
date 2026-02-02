FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --production

FROM node:20-alpine AS runner

WORKDIR /app

# Copy dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./

# Run as non-root user
USER node

EXPOSE 3000

CMD ["node", "server.js"]
