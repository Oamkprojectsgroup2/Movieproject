import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import FavoriteMovieList from "../components/FavoriteMovieList";
import { BASE_URL } from "../config";
import "./styles/GroupDetails.css";
import "./styles/Favourites.css";

const MAX_VISIBLE_GROUP_ITEMS = 4;

async function loadMovieDetails(movieIds) {
  const results = await Promise.allSettled(
    movieIds.map(async (movieId) => {
      const response = await fetch(`${BASE_URL}/movies/${movieId}?language=en-US`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Movie details could not be loaded");
      }

      return data;
    }),
  );

  return {
    movies: results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value)
      .sort((firstMovie, secondMovie) =>
        (firstMovie.title || "").localeCompare(secondMovie.title || "", undefined, {
          sensitivity: "base",
        }),
      ),
    failedMovieIds: results
      .map((result, index) => (result.status === "rejected" ? movieIds[index] : null))
      .filter(Boolean),
  };
}

function getErrorState(response, data) {
  if (response.status === 401) {
    return {title: "Log in to view this group", message: "Group content is available to members only."};
  }

  if (response.status === 403) {
    return {title: "Group access denied", message: data.message || "You are not an accepted member of this group."};
  }

  if (response.status === 404) {
    return {title: "Group not found", message: "This group may have been deleted or the link may be incorrect."};
  }

  return {title: "Group could not be loaded", message: data.message || "Please try again later."};
}

function GroupDetails({user, onLoginClick}) {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [movies, setMovies] = useState([]);
  const [failedMovieIds, setFailedMovieIds] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [showAllMovies, setShowAllMovies] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStatus, setUserStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGroup() {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const groupPromise = fetch(`${BASE_URL}/groups/${groupId}`, { headers});
        //if not valid user, empty promise is ran to not break logic
        const membershipPromise = token ? fetch(`${BASE_URL}/groups/membership/${groupId}`, { headers }) : Promise.resolve(null);
        const [responseGroup, responseMembership] = await Promise.all([groupPromise,membershipPromise]);
        
        const groupData = await responseGroup.json().catch(() => ({}));
        let membership = null;
        if (responseMembership && responseMembership.ok) {
          const membershipStatus = await responseMembership.json().catch(() => ({}));
          membership = membershipStatus.status ?? null;
        }

        if (!responseGroup.ok) {
          const errorState = getErrorState(responseGroup, groupData);
          const err = new Error(errorState.message);
          err.errorState = {...errorState, userStatus: membership };
          err.userStatus = membership;
          throw err;
        }

        if (!cancelled) {
          setShowAllMembers(false);
          setShowAllMovies(false);
          setGroup(groupData.group);
          setUserStatus(membership);
        }
      } catch (loadError) {
        if (!cancelled) {
          const resolvedStatus = loadError.userStatus ?? loadError.errorState?.userStatus ?? null;
          setUserStatus(resolvedStatus);
          setError(loadError.errorState || {
            title: loadError.errorState?.title || "Group could not be loaded",
            message: loadError.message || "Please try again later.",
            userStatus: resolvedStatus,
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGroup();
    return () => {
      cancelled = true;
    };
  }, [groupId, user]);

  useEffect(() => {
    if (!group) return undefined;

    let cancelled = false;
    const movieIds = group.favorites.map((favorite) => favorite.movie_id);

    async function loadGroupMovies() {
      setMoviesLoading(true);
      const details = await loadMovieDetails(movieIds);

      if (!cancelled) {
        setMovies(details.movies);
        setFailedMovieIds(details.failedMovieIds);
        setMoviesLoading(false);
      }
    }

    loadGroupMovies();
    return () => {
      cancelled = true;
    };
  }, [group]);

  if (loading) {
    return (
      <main className="group-details-page">
        <p className="group-details-status">Loading group...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="group-details-page">
        <button type="button" className="back-link group-details-back" onClick={() => navigate("/groups")}>
          ← Back to groups
        </button>
        <section className="group-details-state group-details-state-error" role="alert">
          <div>
            <h1>{error.title}</h1>
            <p>{error.message}</p>
          </div>
          <div>
            <button
              type="button"
              className="btn-primary"
            >
              Request to join group
            </button>
            <p>Status: {userStatus ?? "Not requested"}</p>
          </div>
        </section>
      </main>
    );
  }

  const visibleMembers = showAllMembers
    ? group.members
    : group.members.slice(0, MAX_VISIBLE_GROUP_ITEMS);
  const visibleMovies = showAllMovies
    ? movies
    : movies.slice(0, MAX_VISIBLE_GROUP_ITEMS);
  const visibleFailedMovieIds = showAllMovies
    ? failedMovieIds
    : failedMovieIds.slice(0, Math.max(0, MAX_VISIBLE_GROUP_ITEMS - visibleMovies.length));

  return (
    <main className="group-details-page">
      <button type="button" className="back-link group-details-back" onClick={() => navigate("/groups")}>
        ← Back to groups
      </button>

      <header className="group-details-header">
        <p className="group-details-eyebrow">Private group</p>
        <h1>{group.group_name}</h1>
        <p>
          Created by {group.owner_name} · {group.member_count} {group.member_count === 1 ? "member" : "members"}
        </p>
      </header>

      <div className="group-details-layout">
        <section className="group-details-section">
          <h2>Members</h2>
          {group.members.length > 0 ? (
            <>
              <ul className="group-details-members">
                {visibleMembers.map((member) => (
                  <li key={member.user_id}>
                    <span>{member.user_name}</span>
                    {member.user_id === group.owner_id && (
                      <span className="groups-badge owner">Owner</span>
                    )}
                  </li>
                ))}
              </ul>
              {group.members.length > MAX_VISIBLE_GROUP_ITEMS && (
                <button
                  type="button"
                  className="group-details-members-toggle"
                  onClick={() => setShowAllMembers((current) => !current)}
                >
                  {showAllMembers ? "Show fewer members" : "Show more members"}
                </button>
              )}
            </>
          ) : (
            <p className="group-details-muted">No accepted members yet.</p>
          )}
        </section>

        <section className="group-details-section group-details-movies">
          <h2>Group favorites</h2>
          {moviesLoading ? (
            <p className="group-details-muted">Loading group favorites...</p>
          ) : group.favorites.length > 0 ? (
            <>
              {failedMovieIds.length > 0 && (
                <p className="favourites-partial-warning">
                  Some group movies are temporarily unavailable.
                </p>
              )}
              <FavoriteMovieList movies={visibleMovies} failedMovieIds={visibleFailedMovieIds} />
              {group.favorites.length > MAX_VISIBLE_GROUP_ITEMS && (
                <button
                  type="button"
                  className="group-details-members-toggle"
                  onClick={() => setShowAllMovies((current) => !current)}
                >
                  {showAllMovies ? "Show fewer movies" : "Show more movies"}
                </button>
              )}
            </>
          ) : (
            <p className="group-details-muted">No movies have been added to this group yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}

export default GroupDetails;
