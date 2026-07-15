# ── Stage 1: Build the Vite application ──────────────────
FROM node:20-alpine AS builder

# ═══════════════════════════════════════════════════════════
# Build-time environment variables
# VITE_* vars are baked into the JS bundle at build time.
# Docker Compose passes these via `args:`.
# Render passes these via Dashboard → Environment → Build Args.
# ═══════════════════════════════════════════════════════════
ARG VITE_NVIDIA_API_KEY
ENV VITE_NVIDIA_API_KEY=$VITE_NVIDIA_API_KEY

ARG VITE_SUPABASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL

ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

WORKDIR /app

# Install dependencies (cached separately from source)
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

# Copy source and build
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY index.html ./
COPY public/ public/
COPY src/ src/

RUN npm run build

# ── Stage 2: Serve with nginx ────────────────────────────
FROM nginx:alpine

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy the built SPA and nginx config
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Security: remove nginx version from headers
RUN echo "server_tokens off;" > /etc/nginx/conf.d/security.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
