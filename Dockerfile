FROM node:20-bookworm AS build

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases ./.yarn/releases
RUN node .yarn/releases/yarn-3.6.4.cjs install --immutable

COPY . .
RUN node .yarn/releases/yarn-3.6.4.cjs exec prisma generate
RUN node .yarn/releases/yarn-3.6.4.cjs build

FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=build /app/.yarn/releases ./.yarn/releases
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
CMD ["sh", "-c", "node .yarn/releases/yarn-3.6.4.cjs exec prisma migrate deploy && node .yarn/releases/yarn-3.6.4.cjs start"]
