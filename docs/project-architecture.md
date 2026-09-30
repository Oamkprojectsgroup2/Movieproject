## The project folder structure

React frontend and Node backend are in their own folders.
```text
Movieproject/
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── server/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── docs/
│
├── .gitignore
├── README.md
└── docker-compose.yml
```
- `client/` = React user interface
- `server/` = Node backend and REST API
- `server/tests/` = automated REST tests for the backend
- `docs/` = project documentation, such as UI design, database schema, REST documentation and presentation materials
- `docker-compose.yml` = for example, to start PostgreSQL and later, possibly other environments

## The responsibilities of the frontend and backend

### Frontend / React (`client/`)

- displays the user interface
- handles user input
- displays movies, TV shows, reviews, favorites, groups, etc.
- sends requests to its own Node backend
- does not directly interact with the database
- does not store secret API keys

## Frontend routing

The frontend uses [React Router](https://reactrouter.com/) (`react-router` v8) to switch between pages. Each page has its own URL.

- `client/src/main.jsx` wraps the app in `<BrowserRouter>`.
- `client/src/App.jsx` lists all routes inside `<Routes>`.
- The navbar and the login/register popup are outside `<Routes>`, so they appear on every page.

| Path        | View                   |
|-------------|------------------------|
| `/`         | `views/Home.jsx`       |
| `/search`   | `views/Search.jsx`     |
| `/theaters` | `views/Theaters.jsx`   |
| `/favourites` | `views/Favourites.jsx` (authenticated owner) |
| `/groups`     | `views/Groups.jsx` |
| `/groups/:groupId` | `views/GroupDetails.jsx` (authenticated accepted group member) |
| `/profile`    | `views/Profile.jsx` (only when logged in) |
| `/reviews`    | `components/Placeholder.jsx` (for now) |
| `*`           | `components/Placeholder.jsx` (404)    |

### Adding a new page

1. Create the component in `client/src/views/`.
2. Add a route to `App.jsx`:
   `<Route path="/favourites" element={<Favourites />} />`
3. Navigate to it with `useNavigate()` or `<Link to="/favourites">`.

Import everything from `react-router` (not `react-router-dom`).

### Backend / Node (`server/`)

- provides a REST API to the frontend
- handles authentication and permissions
- validates data coming into the backend
- reads from and writes to the PostgreSQL database
- makes TMDB API calls
- stores secret keys in environment variables
- returns only the necessary data to the frontend

### Favorite movie list API

- `GET /api/favorites` returns the authenticated user's TMDB movie IDs.
- `POST /api/favorites` and `DELETE /api/favorites/:movieId` manage the
   authenticated user's list.
- `GET /api/movies/:movieId` retrieves TMDB details through the backend for
   rendering favorite movie cards; the TMDB token is never sent to the client.

### Group API

- `GET /api/groups` returns the public group list. When an authenticated token
   is supplied, each row also includes the current user's membership status.
- `POST /api/groups` creates a group for the authenticated user and adds the
   creator as an accepted member.
- `GET /api/groups/:groupId` returns private group details for the owner or an
   accepted member. The response includes group metadata, accepted members, and
   group favorite movie IDs with the name of the user who added each movie when
   that user still exists. Authorized responses also include the server-derived
   `is_owner` boolean for presentation decisions.
- Guests, pending members, rejected members, and non-members cannot access
   group details. The endpoint returns `401` for missing or invalid
   authentication, `403` for an authenticated user without access, and `404`
   when the group does not exist.
- No group membership or management mutation endpoints currently exist. Future
   owner-only actions must compare `req.user.user_id` with the authoritative
   `groups.owner_id` on the server; client-provided ownership flags must never
   determine authorization.
- The group page requests movie metadata from `GET /api/movies/:movieId` and
   keeps individual TMDB lookup failures visible without hiding the rest of the
   group content.

## The handling of environment variables and API keys

- Sensitive values, such as the **TMDB API token** and database password, are stored in a local `.env` file.
- The `.env` file is added to the `.gitignore` file and is never committed to GitHub.
- A `.env.example` file is added to the repo, which lists the names of the required variables but does not contain the actual secrets.
- Each team member creates their own local `.env` file based on the `.env.example` file.
- The TMDB API key/token is stored in the backend, not in the React frontend.

## UI Design

UI design for the application's main views can be found here:

https://app.moqups.com/18rY5TpVjkg3Efdq29XSFj8xlJ2pqsJf/view/page/ad64222d5