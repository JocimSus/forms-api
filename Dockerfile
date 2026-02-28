FROM node:lts-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm prisma generate
CMD ["node", "server.js"]
