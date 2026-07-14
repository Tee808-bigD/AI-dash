FROM node:20-alpine

WORKDIR /app

# Zero npm dependencies — just the server script
COPY server.js .

# Run as non-root user for security
USER node

EXPOSE 3001

CMD ["node", "server.js"]
