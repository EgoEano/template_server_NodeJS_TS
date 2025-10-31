# Stage 1. Pre-assembly
FROM alpine:latest AS build

RUN apk add --no-cache \
    nodejs \
    libstdc++ \
    curl \
    npm

WORKDIR /app
# Now the build is performed outside of Docker 
COPY docker_dist/ ./

RUN npm cache clean --force \
    && npm install dotenv bcrypt --omit=dev

# Stage 2. Final container
FROM alpine:latest

# Setting group and user for Node
RUN addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node

RUN apk add --no-cache nodejs libstdc++

WORKDIR /app
COPY --from=build /app ./

ENV NODE_OPTIONS="--require dotenv/config"
USER node
CMD ["node", "server.js"]
