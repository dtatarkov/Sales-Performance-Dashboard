# Multi-stage build for the Sales Dashboard frontend (Next.js 16, standalone).

FROM node:22-alpine AS build
WORKDIR /app

# Dependencies as a separate layer (cached until the lockfile changes).
COPY package.json package-lock.json ./
RUN npm ci

# Build-time API URL: the value is inlined into the bundle (frontend.md §8).
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

COPY . .
RUN npm run build

FROM node:22-alpine AS final
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]
