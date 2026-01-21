FROM node:20-alpine

WORKDIR /app

# Install dependencies first to leverage Docker layer caching
COPY package.json package-lock.json tsconfig.json prisma/schema.prisma ./
RUN npm install
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Build TypeScript sources ahead of time
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
