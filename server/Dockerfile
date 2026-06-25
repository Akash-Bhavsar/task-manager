# Server (Express + Prisma) image for Render's Docker runtime.
# Node 20 (the app/Prisma stack requires >=18; Node 16 is EOL).
FROM node:20-slim

WORKDIR /app

# Prisma's query engine needs OpenSSL at build and runtime.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies first for better layer caching.
COPY package*.json ./
RUN npm ci

# Copy source (see .dockerignore — node_modules, dist and .env are excluded).
COPY . .

# Generate the Prisma client and compile TypeScript to dist/.
RUN npx prisma generate && npm run build

ENV NODE_ENV=production

# Documentation only — Render injects PORT and the app reads process.env.PORT.
EXPOSE 3000

# Sync the schema to the database, then start the API.
# (Leave Render's "Pre-Deploy Command" empty — this CMD handles db push.)
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
