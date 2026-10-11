# ЭТАП 1: Сборка приложения (Builder)
FROM node:24-alpine AS builder
WORKDIR /app

# Копируем манифесты зависимостей
COPY package.json yarn.lock ./

# Устанавливаем ВСЕ зависимости для компиляции и очищаем кэш Yarn
RUN yarn install --frozen-lockfile && yarn cache clean

# Копируем файлы конфигураций и исходный код
COPY nest-cli.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY drizzle.config.ts ./
COPY src ./src

# Собираем TypeScript-код в JavaScript (в папку dist)
RUN ./node_modules/.bin/nest build

# ЭТАП 2: Чистый продакшн-образ (Runner)
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json yarn.lock ./

# Устанавливаем ТОЛЬКО продакшн-зависимости и полностью вычищаем кэш пакетов
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Копируем скомпилированное NestJS-приложение из этапа builder
COPY --from=builder /app/dist ./dist

# Копируем папку с готовыми SQL-миграциями для DatabaseModule
COPY drizzle ./drizzle

EXPOSE 3000

# Запускаем чистый JS через node
CMD ["node", "dist/main.js"]
