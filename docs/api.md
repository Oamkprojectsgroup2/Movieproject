# REST API

This document describes the REST endpoints implemented by the Movieproject
backend. The API is served by the Node.js server (port `3001` in local
development) and uses the `/api` prefix.

```text
http://localhost:3001/api
```

Requests and JSON responses use `Content-Type: application/json` where a body
is present. Movie and TV catalog responses are passed through from TMDB; the
server does not reshape their result objects. TMDB credentials are kept on the
server.

## Authentication

Protected endpoints require a valid JWT in the `Authorization` header:

```http
Authorization: Bearer <token>
```

Obtain a token with `POST /api/auth/login`. Tokens expire after one hour.
Endpoints marked **Public** do not require a token. `GET /api/groups` accepts
an optional token; without a valid token, it returns the public group list with
`my_status` unset.

An authentication failure returns `401`:

```json
{"message":"Authentication required"}
```

An invalid or expired token returns:

```json
{"message":"Invalid or expired token"}
```

## Health

### `GET /api/health` — Public

Checks that the API process is responding.

**Response `200`:**

```json
{"status":"ok"}
```

## Authentication and accounts

### `POST /api/auth/register` — Public

Creates an account. Email is trimmed and lowercased. Passwords must be at
least 8 characters and contain at least one uppercase letter and one digit.

**Request body:**

```json
{
  "user_name": "movie_fan",
  "email": "fan@example.com",
  "password": "Example123"
}
```

**Responses:** `201` returns a success message and the new user (`user_id`,
`user_name`, `email`). `400` means a required field is missing; `409` means the
username or email is already in use, or the password does not meet the
requirements; `500` indicates a registration error.

```json
{
  "message": "Registration successful",
  "user": {"user_id": 12, "user_name": "movie_fan", "email": "fan@example.com"}
}
```

### `POST /api/auth/login` — Public

Authenticates with email and password. The email is trimmed and lowercased.

**Request body:**

```json
{"email":"fan@example.com","password":"Example123"}
```

**Responses:** `200` returns a signed JWT and the user identity; `400` means
email or password is missing; `401` means the credentials are invalid; `500`
indicates an authentication configuration or login error.

```json
{
  "message": "Login successful",
  "token": "<jwt>",
  "user": {"user_id": 12, "user_name": "movie_fan", "email": "fan@example.com"}
}
```

### `POST /api/auth/logout` — Authentication required

Acknowledges logout. The current JWT implementation is stateless: this
endpoint does not revoke the token. The client should discard it.

**Responses:** `200` on success; `401` if authentication is missing or invalid.

```json
{"message":"Logout successful"}
```

### `DELETE /api/auth/account` — Authentication required

Deletes the authenticated user's account. The current password must be
provided. Deletion is rejected while the user owns a group; transfer ownership
first.

**Request body:**

```json
{"password":"Example123"}
```

**Responses:** `200` on success; `400` if the password is missing; `401` if
authentication fails or the password is incorrect; `404` if the account no
longer exists; `409` if the user still owns a group; `500` on an account
deletion error.

```json
{"message":"Account deleted successfully"}
```

## Movies

Movie IDs are TMDB movie IDs. Catalog endpoints return the corresponding TMDB
JSON response (including its pagination and result fields where applicable).
Unless noted otherwise, catalog endpoints accept these optional query
parameters:

| Parameter | Default | Description |
|---|---|---|
| `page` | `1` | TMDB result page |
| `language` | `fi-FI` | Language for the response |
| `region` | `FI` | Region for the response |

### `GET /api/movies/nowplaying` — Public

Currently playing movies. Accepts the common catalog query parameters above.
Returns `200` with the TMDB paginated movie response; upstream errors return
`500`.

### `GET /api/movies/popular` — Public

Popular movies. Accepts the common catalog query parameters above. Returns
`200` with the TMDB paginated movie response; upstream errors return `500`.

### `GET /api/movies/top_rated` — Public

Top-rated movies. Accepts the common catalog query parameters above. Returns
`200` with the TMDB paginated movie response; upstream errors return `500`.

### `GET /api/movies/upcoming` — Public

Upcoming movies. Accepts the common catalog query parameters above. Returns
`200` with the TMDB paginated movie response; upstream errors return `500`.

### `GET /api/movies/search` — Public

Searches movies.

| Query parameter | Required | Default | Description |
|---|---:|---|---|
| `query` | Yes | — | Search text |
| `page` | No | `1` | TMDB result page |
| `language` | No | `fi-FI` | Response language |
| `region` | No | `FI` | Response region |
| `year` | No | — | Primary release year |

**Example:**

```http
GET /api/movies/search?query=matrix&year=1999&page=1
```

Returns `200` with the TMDB paginated search response; `400` if `query` is
missing; `500` on an upstream error.

### `GET /api/movies/genres` — Public

Returns the TMDB movie genre list. Optional query parameter: `language`
(default `fi-FI`). Returns `200` with the TMDB genre response; upstream errors
return `500`.

### `GET /api/movies/recommended` — Authentication required

Returns up to 20 recommendations personalized using the authenticated user's
favorite movies and reviews. Favorite movies and movies already reviewed by
the user are excluded. Optional query parameters: `language` (default
`fi-FI`) and `region` (default `FI`).

**Example:**

```http
GET /api/movies/recommended?language=en-US
Authorization: Bearer <token>
```

**Response `200`:** `type` is `"recommended"` when personalized results were
found, otherwise `"popular"`; `results` is an array of TMDB movie objects.
Recommendation loading errors return `500`.

```json
{"type":"recommended","results":[{"id":603,"title":"The Matrix"}]}
```

### `GET /api/movies/:id` — Public

Returns movie details, including appended credits.

| Path parameter | Description |
|---|---|
| `id` | Numeric TMDB movie ID |

Optional query parameter: `language` (default `fi-FI`).

**Example:** `GET /api/movies/603?language=en-US`

Returns `200` with the TMDB movie detail response; `400` for a non-numeric ID;
`404` if TMDB reports that the movie does not exist; `500` for other upstream
errors.

## TV series

TV catalog endpoints return the corresponding TMDB JSON response. For list
endpoints, optional `page` defaults to `1`, `language` to `fi-FI`, and `region`
to `FI`.

### `GET /api/tv/popular` — Public

Popular TV series. Returns `200` with a TMDB paginated response; upstream
errors return `500`.

### `GET /api/tv/top_rated` — Public

Top-rated TV series. Returns `200` with a TMDB paginated response; upstream
errors return `500`.

### `GET /api/tv/airing_today` — Public

TV series airing today. Returns `200` with a TMDB paginated response; upstream
errors return `500`.

### `GET /api/tv/on_the_air` — Public

TV series currently on the air. Returns `200` with a TMDB paginated response;
upstream errors return `500`.

### `GET /api/tv/search` — Public

Searches TV series.

| Query parameter | Required | Default | Description |
|---|---:|---|---|
| `query` | Yes | — | Search text |
| `page` | No | `1` | TMDB result page |
| `language` | No | `fi-FI` | Response language |
| `region` | No | `FI` | Response region |
| `year` | No | — | First air date year |

Returns `200` with the TMDB paginated search response; `400` if `query` is
missing; `500` on an upstream error.

### `GET /api/tv/genres` — Public

Returns the TMDB TV genre list. Optional query parameter: `language` (default
`fi-FI`). Returns `200` with the TMDB genre response; upstream errors return
`500`.

## Favorites

The authenticated user's identity is determined by the JWT; clients do not
send a user ID for their own favorites. Favorites store movie IDs only.

### `GET /api/favorites` — Authentication required

Lists the authenticated user's favorites, ordered by movie ID.

**Response `200`:**

```json
{"favorites":[{"movie_id":550}]}
```

Returns `401` if authentication fails; `500` on a storage error.

### `POST /api/favorites` — Authentication required

Adds a movie to the authenticated user's favorites. `movie_id` must be a
positive integer.

**Request body:**

```json
{"movie_id":550}
```

**Responses:** `201` when a favorite is created; `200` when it already exists
(idempotent); `400` for an invalid ID; `401` if authentication fails; `500` on
a storage error.

```json
{"favorite":{"movie_id":550}}
```

### `DELETE /api/favorites/:movieId` — Authentication required

Removes the specified movie from the authenticated user's favorites.

| Path parameter | Description |
|---|---|
| `movieId` | Positive integer TMDB movie ID |

Returns `204` with no response body when removed or already absent (idempotent);
`400` for an invalid ID; `401` if authentication fails; `500` on a storage
error.

### `GET /api/favorites/share/:userId` — Public

Lists another user's favorites by account ID.

| Path parameter | Description |
|---|---|
| `userId` | Positive integer account ID |

**Response `200`:** The favorites are ID-only. `username`, `user_name`, and
`name` are aliases carrying the same username.

```json
{
  "favorites":[{"movie_id":550}],
  "username":"movie_fan",
  "user_name":"movie_fan",
  "name":"movie_fan"
}
```

Returns `400` for an invalid ID; `500` on a storage error.

## Reviews

Reviews are associated with the authenticated user and a TMDB movie ID.
Ratings are integers from 1 to 5.

### `POST /api/reviews/create` — Authentication required

Creates a review. A user can have only one review per movie.

**Request body:**

```json
{"movieId":"603","rating":5,"reviewText":"A favorite."}
```

`movieId` and `rating` are required; `reviewText` is optional.

**Responses:** `201` with the created review; `400` for a missing/invalid movie
ID or rating; `401` if authentication fails; `409` if the user already
reviewed this movie; `500` on a storage error.

```json
{
  "message":"Create review successful",
  "review":{"user_id":12,"movies_tmdb_id":603,"star":5,"review":"A favorite."}
}
```

### `GET /api/reviews/search/:movieId` — Public

Lists reviews for a movie, newest first.

| Path parameter | Description |
|---|---|
| `movieId` | Numeric TMDB movie ID |

**Response `200`:** `reviews` contains review IDs, movie and user IDs,
creation timestamps, ratings, review text, and usernames; `count` is its
length.

```json
{
  "count":1,
  "reviews":[{
    "review_id":7,
    "movies_tmdb_id":603,
    "user_id":12,
    "created_at":"2026-01-01T12:00:00.000Z",
    "star":5,
    "review":"A favorite.",
    "user_name":"movie_fan"
  }]
}
```

Returns `400` for a non-numeric movie ID; `500` on a storage error.

### `PUT /api/reviews/update` — Authentication required

Updates the authenticated user's review for a movie. The body requires
`movieId` and `rating`; `reviewText` is optional. An omitted or blank
`reviewText` leaves the saved review text unchanged.

**Request body:**

```json
{"movieId":"603","rating":4,"reviewText":"Still a favorite."}
```

Returns `200` with the updated review; `400` for a missing/invalid movie ID or
rating; `401` if authentication fails; `404` if the user's review does not
exist; `500` on a storage error.

```json
{
  "message":"Update review successful",
  "review":{"user_id":12,"movies_tmdb_id":603,"star":4,"review":"Still a favorite."}
}
```

### `DELETE /api/reviews/delete/:movieId` — Authentication required

Deletes the authenticated user's review for a movie.

| Path parameter | Description |
|---|---|
| `movieId` | Numeric TMDB movie ID |

Returns `200` with `{"message":"Delete review successful"}`; `400` for a
non-numeric ID; `401` if authentication fails; `404` if the user's review
does not exist; `500` on a storage error.

### `GET /api/reviews/me` — Authentication required

Lists the authenticated user's reviews, newest first. Returns `200` with
`count` and a `reviews` array (each containing `review_id`, `movies_tmdb_id`,
`created_at`, `star`, and `review`); `401` if authentication fails; `500` on a
storage error.

### `GET /api/reviews/averages` — Public

Returns average ratings and review counts for the requested movie IDs.

| Query parameter | Required | Description |
|---|---:|---|
| `ids` | No | Comma-separated numeric TMDB movie IDs |

**Example:** `GET /api/reviews/averages?ids=603,550`

Returns `200` as an object keyed by movie ID. IDs without reviews are omitted;
no valid IDs returns an empty object. Non-numeric items in `ids` are ignored.

```json
{
  "603":{"average":4.5,"count":2},
  "550":{"average":5,"count":1}
}
```

Storage errors return `500`.

## Groups

Groups support owner-managed membership and a shared movie-favorites list.
Group IDs, user IDs, and movie IDs in this section are positive integers.

### `GET /api/groups` — Public; optional authentication

Lists groups alphabetically. Returns `200` with `groups`; each group has
`group_id`, `group_name`, `owner_id`, `owner_name`, `member_count` (accepted
members only), and `my_status` (`pending`, `accepted`, `rejected`, or `null`
when the caller has no membership). `500` on a storage error.

```json
{
  "groups":[{
    "group_id":3,
    "group_name":"Weekend watchlist",
    "owner_id":12,
    "owner_name":"movie_fan",
    "member_count":2,
    "my_status":"accepted"
  }]
}
```

### `POST /api/groups` — Authentication required

Creates a group owned by the authenticated user, who is added as an accepted
member.

**Request body:**

```json
{"group_name":"Weekend watchlist"}
```

The trimmed group name must contain 1–50 characters. Returns `201` with the
created group (`group_id`, `group_name`, `owner_id`); `400` for a missing or
too-long name; `401` if authentication fails; `500` on a storage error.

### `GET /api/groups/:groupId` — Authentication required

Returns group details. The caller must be the owner or an accepted member.

| Path parameter | Description |
|---|---|
| `groupId` | Positive integer group ID |

Returns `200` with a `group` containing its ID, name, owner ID and name,
accepted `member_count`, `is_owner`, `members` (`user_id`, `user_name`), and
`favorites` (`movie_id`, `added_by`); `400` for an invalid ID; `401` if
authentication fails; `403` if the caller is not allowed to view the group;
`404` if it does not exist; `500` on a storage error.

### `GET /api/groups/membership/:groupId` — Authentication required

Checks the authenticated user's membership status.

| Path parameter | Description |
|---|---|
| `groupId` | Numeric group ID |

Returns `200` with a `status` of `pending`, `accepted`, `rejected`, or `null`
when no membership exists; `400` for an invalid ID; `401` if authentication
fails; `500` on a storage error.

```json
{"message":"Membership check successful","status":"accepted"}
```

### `POST /api/groups/join/:groupId` — Authentication required

Requests to join a group. A new membership is created with `pending` status.

| Path parameter | Description |
|---|---|
| `groupId` | Numeric group ID |

Returns `201` with the pending membership; `400` for an invalid ID; `401` if
authentication fails; `404` if the group or user does not exist; `409` if a
membership request already exists; `500` on a storage error.

```json
{"message":"Join request successful","data":{"user_id":13,"group_id":3,"status":"pending"}}
```

### `GET /api/groups/pending/:groupId` — Authentication required

Lists pending join requests. Only the group owner can use this endpoint.

| Path parameter | Description |
|---|---|
| `groupId` | Numeric group ID |

Returns `200` with pending users in `data` (`user_id`, `user_name`, `status`);
`400` for an invalid ID; `401` if authentication fails; `403` if the caller is
not the owner; `500` on a storage error.

### `PUT /api/groups/accept/:groupId/:userId` — Authentication required

Accepts a pending member. Only the group owner can accept requests.

| Path parameter | Description |
|---|---|
| `groupId` | Numeric group ID |
| `userId` | Numeric ID of the pending member |

Returns `200` with the accepted membership; `400` for an invalid ID; `401` if
authentication fails; `403` if the caller is not the owner; `404` if there is
no pending request; `500` on a storage error.

### `PUT /api/groups/reject/:groupId/:userId` — Authentication required

Rejects a pending member. Only the group owner can reject requests.

| Path parameter | Description |
|---|---|
| `groupId` | Numeric group ID |
| `userId` | Numeric ID of the pending member |

Returns `200` with the rejected membership; `400` for an invalid ID; `401` if
authentication fails; `403` if the caller is not the owner; `404` if there is
no pending request; `500` on a storage error.

### `POST /api/groups/:groupId/favorites` — Authentication required

Adds a movie to the group. The authenticated user must be an accepted member.

**Request body:**

```json
{"movie_id":550}
```

Returns `201` when added or `200` when the movie is already in the group;
`400` for an invalid group or movie ID; `401` if authentication fails; `403`
if the caller is not an accepted member; `404` if the group does not exist;
`500` on a storage error.

```json
{"message":"Movie added to group","added":true}
```

### `DELETE /api/groups/:groupId/favorites/:movieId` — Authentication required

Removes a movie from a group. Only the group owner can remove group movies.

| Path parameter | Description |
|---|---|
| `groupId` | Positive integer group ID |
| `movieId` | Positive integer TMDB movie ID |

Returns `204` with no response body; `400` for an invalid ID; `401` if
authentication fails; `403` if the caller is not the owner; `404` if the group
or movie entry does not exist; `500` on a storage error.

### `DELETE /api/groups/:groupId` — Authentication required

Deletes a group. Only the owner can delete it.

| Path parameter | Description |
|---|---|
| `groupId` | Positive integer group ID |

Returns `204` with no response body; `400` for an invalid ID; `401` if
authentication fails; `403` if the caller is not the owner; `404` if the
group does not exist; `500` on a storage error.

## Configuration

### `GET /api/config/languages` — Public

Returns the TMDB language configuration as a JSON array. Returns `200` on
success; `500` if the upstream service fails.

## Not found

Requests that do not match a registered route return `404`:

```json
{"message":"Route /api/unknown not found"}
```
