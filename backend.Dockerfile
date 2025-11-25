# backend.Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./

# Skip Puppeteer Chromium download
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN npm install --legacy-peer-deps

COPY backend .

EXPOSE 5001

CMD ["npm", "start"]
