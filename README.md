# Bitespeed

A Node.js and TypeScript based identity reconciliation service using PostgreSQL and Prisma ORM to link multiple customer contacts for a personalized experience.

## Setup

### Prerequisites

- Node.js >= 16.13
- Docker
- Docker Compose

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/deval2498/bitespeed.git
   cd bitespeed
2. Install dependencies:
    ```bash
    npm install
3. Install Prisma CLI and use prisma generate:
    ```bash
    npm install prisma --save-dev
    npx prisma generate
4. Start the project:
    ```bash
    npm start
### Installation using docker
Facing some issues with docker, Had to restart it 2 times for it to work need to figure this out seperately
1. Clone the repository:
   ```bash
   git clone https://github.com/deval2498/bitespeed.git
   cd bitespeed
2. Install dependencies:
    ```bash
    npm install
3. Set up docker container:
    ```bash
    docker-compose up --build



    
