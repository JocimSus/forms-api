FROM node:lts-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile
CMD ["sh", "-c", "pnpm prisma generate && node server.js"]
