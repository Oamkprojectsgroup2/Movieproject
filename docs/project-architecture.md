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
| `*`         | "Page not found"       |

### Adding a new page

1. Create the component in `client/src/views/`.
2. Add a route to `App.jsx`:
   `<Route path="/favourites" element={<Favourites />} />`
3. Navigate to it with `useNavigate()` or `<Link to="/favourites">`.

Import everything from `react-router
### Backend / Node (`server/`)

- provides a REST API to the frontend
- handles authentication and permissions
- validates data coming into the backend
- reads from and writes to the PostgreSQL database
- makes TMDB API calls
- stores secret keys in environment variables
- returns only the necessary data to the frontend

## The handling of environment variables and API keys

- Sensitive values, such as the **TMDB API token** and database password, are stored in a local `.env` file.
- The `.env` file is added to the `.gitignore` file and is never committed to GitHub.
- A `.env.example` file is added to the repo, which lists the names of the required variables but does not contain the actual secrets.
- Each team member creates their own local `.env` file based on the `.env.example` file.
- The TMDB API key/token is stored in the backend, not in the React frontend.

## UI Design

UI design for the application's main views can be found here:

https://app.moqups.com/18rY5TpVjkg3Efdq29XSFj8xlJ2pqsJf/view/page/ad64222d5