FROM node:16

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate the Prisma client
RUN npx prisma generate

# Apply database migrations
RUN npx prisma migrate deploy

# Start the application
CMD ["npm", "start"]
