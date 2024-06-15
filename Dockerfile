FROM node:16

WORKDIR /app

# Install PostgreSQL client tools
RUN apt-get update && apt-get install -y postgresql-client

COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY . .

# Copy the entrypoint and wait-for-it scripts
COPY wait-for-it.sh ./
COPY entrypoint.sh ./
RUN chmod +x wait-for-it.sh entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
