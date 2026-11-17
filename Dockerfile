FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV PORT=10000
ENV HOST=0.0.0.0
ENV REMOTION_CACHE_DIR=/opt/remotion-cache

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
    fontconfig \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcairo2 \
    libdbus-1-3 \
    libdrm2 \
    libglib2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libcups2 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    libxrender1 \
    libxshmfence1 \
    libxss1 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Instala o Chromium compatível com a versão do Remotion no próprio container.
RUN npx remotion browser ensure

COPY . .

RUN mkdir -p /var/data/jobs /opt/remotion-cache

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 10000) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server/index.mjs"]
