# Movieproject

Web application project using React, Node.js, PostgreSQL and Docker.

## Prerequisites

Make sure the following are installed:

- Node.js
- npm
- Docker Desktop
- Git

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/Oamkprojectsgroup2/Movieproject.git
cd Movieproject
```

### 2. Create environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update the values in `.env` if necessary.

Do not commit the `.env` file to Git.

### 3. Start PostgreSQL

From the project root:

```bash
docker compose up -d
```

Check that the database container is running:

```bash
docker compose ps
```

### 4. Start the backend

Open a new terminal:

```bash
cd server
npm install
npm run dev
```

The backend runs at:

```
http://localhost:3001
```

Health check:

```
http://localhost:3001/api/health
```

### 5. Start the frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs by default at:

```
http://localhost:5173
```

## Stopping the development environment

Stop the frontend and backend with:

```
Ctrl + C
```

Stop PostgreSQL from the project root:

```bash
docker compose down
```

