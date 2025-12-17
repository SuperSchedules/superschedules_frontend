FROM node:20 AS build

# Build arguments for Vite environment variables
ARG VITE_API_BASE_URL=https://api.eventzombie.com
ARG VITE_TURNSTILE_SITE_KEY

# Make build args available to Vite during build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY

# Enable corepack for pnpm support
RUN corepack enable

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage with nginx
FROM nginx:1.27-alpine

# Create nginx config directory
RUN mkdir -p /etc/nginx/conf.d

# Copy custom nginx configuration
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  
  # Handle SPA routing
  location / {
    try_files \$uri /index.html;
  }
  
  # Cache static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
EOF

# Copy built app from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80