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

### Favorite movies API

Owner operations require an authenticated user's JWT:

```http
Authorization: Bearer <token>
```

The API stores only TMDB movie IDs. The client does not provide a user ID; the
user is taken from the verified JWT.

List the current user's favorites:

```http
GET /api/favorites
```

The response is an ID-only list:

```json
{"favorites":[{"movie_id":550}]}
```

Add a favorite:

```http
POST /api/favorites
Content-Type: application/json

{"movie_id":550}
```

A new favorite returns `201`. Adding an existing favorite is idempotent and
returns `200` without creating a duplicate row. Movie IDs must be positive
integers.

Remove a favorite:

```http
DELETE /api/favorites/550
```

Removal returns `204`. Removing an ID that is not currently saved is also
idempotent and returns `204`.

Enable sharing for the current user's list:

```http
POST /api/favorites/share
Authorization: Bearer <token>
```

The operation is idempotent and returns a stable token:

```json
{"shared_token":"11111111-1111-4111-8111-111111111111"}
```

Anyone with the token can view the public list:

```http
GET /api/favorites/shared/<shared_token>
```

The public response contains the owner's username and movie IDs only. Unknown
or malformed tokens return `404`.

The application pages are `/favourites` for the authenticated owner and
`/favourites/share/<shared_token>` for a read-only public list. Movie details
are loaded through `GET /api/movies/<movie_id>` so the TMDB token remains on
the server.

## Stopping the development environment

Stop the frontend and backend with:

```
Ctrl + C
```

Stop PostgreSQL from the project root:

```bash
docker compose down
```

