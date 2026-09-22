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

### 5. Load the test data (optional)

`npm install` in the previous step already created the tables. To also load the
shared test data — 20 users, reviews, favorites and groups:

```bash
cd server
npm run db:seed
```

Login credentials and the test scenarios each account covers are in
[server/db/TEST_USERS.md](server/db/TEST_USERS.md).

To wipe the database and reload it from scratch:

```bash
npm run db:reset
```

### 6. Run authentication API tests

Create a separate test environment file from the committed template:

```powershell
Copy-Item .env.test.example .env.test
```

Start the isolated PostgreSQL test database from the project root:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml up -d
```

Run the registration, login and logout REST API tests:

```powershell
Set-Location server
npm test
```

The test database uses `movieproject_test` on port `5433` and is separate from the development database. The suite tests `POST /api/auth/register`, `POST /api/auth/login`, and the authenticated `POST /api/auth/logout` endpoint.

Logout is an authenticated acknowledgement. The current JWT setup is stateless, so the client removes the token locally and the server does not revoke an already-issued token before its expiry.

Stop the test database when testing is complete:

```powershell
Set-Location ..
docker compose --env-file .env.test -f docker-compose.test.yml down
```

### 7. Start the frontend

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

### Account deletion API

Delete the authenticated user's account:

```http
DELETE /api/auth/account
Authorization: Bearer <token>
Content-Type: application/json

{"password":"<current password>"}
```

The endpoint returns `200` after successful deletion. The current password is
required and is verified against the stored password hash. Incorrect passwords
return `401`; missing passwords return `400`; unauthenticated requests return
`401`; and deletion is rejected with `409` while the user owns a group.

Successful deletion cascades to the user's reviews, favorite movies, and group
memberships. Favorite entries in surviving groups retain the movie but clear
the deleted user's attribution.

## Stopping the development environment

Stop the frontend and backend with:

```
Ctrl + C
```

Stop PostgreSQL from the project root:

```bash
docker compose down
```

