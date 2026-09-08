# ---------- Development stage (local use) ----------
FROM node:20-bullseye AS dev
WORKDIR /app

COPY package*.json ./

RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000

RUN npm ci --legacy-peer-deps

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]

# ---------- Build stage ----------
FROM node:20-bullseye AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV NODE_OPTIONS=--max-old-space-size=2048
RUN npm run build

# ---------- Production stage (nginx) ----------
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html/50x.html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]