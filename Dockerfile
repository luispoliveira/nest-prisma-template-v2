FROM node:20 AS builder

# Create app directory
WORKDIR /app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
COPY prisma ./prisma/
COPY .env ./
# Install app dependencies
RUN yarn
RUN yarn prisma:generate

COPY . .

RUN export $(cat .env | xargs) && npm run build:${NEST_APP}

FROM node:20

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env ./

EXPOSE 3000
CMD ["sh", "-c", "export $(cat .env | xargs) && npm run start:prod:${NEST_APP}"]
