FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install --legacy-peer-deps

FROM node:18-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY src ./src
# Force rebuild with timestamp
RUN echo "Build timestamp: $(date)" > build-info.txt
RUN npx tsc

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY --from=build /app/dist ./dist
EXPOSE 4000
COPY public ./public
CMD ["node", "dist/index.js"]


