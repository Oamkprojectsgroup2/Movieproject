import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import FavoriteMovieList from "../components/FavoriteMovieList";
import { BASE_URL } from "../config";
import "./styles/GroupDetails.css";
import "./styles/Favourites.css";
import Modal from "../components/Modal";
import "./../components/styles/Auth.css";

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
    return { title: "Log in to view this group", message: "Group content is available to members only." };
  }

  if (response.status === 403) {
    return { title: "Group access denied", message: data.message || "You are not an accepted member of this group." };
  }

  if (response.status === 404) {
    return { title: "Group not found", message: "This group may have been deleted or the link may be incorrect." };
  }

  return { title: "Group could not be loaded", message: data.message || "Please try again later." };
}

function GroupDetails() {
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
  const [removingMovieId, setRemovingMovieId] = useState(null);
  const [movieActionError, setMovieActionError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadGroup() {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/groups/${groupId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errorState = getErrorState(response, data);
          throw Object.assign(new Error(errorState.message), { errorState });
        }

        if (!cancelled) {
          setShowAllMembers(false);
          setShowAllMovies(false);
          setGroup(data.group);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.errorState || {
            title: "Group could not be loaded",
            message: loadError.message || "Please try again later.",
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
  }, [groupId]);

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteConfirmation("");
    setDeleteError("");
  };

  const handleDeleteGroup = async (event) => {
    event.preventDefault();
    if (deleteConfirmation !== "DELETE" || deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch(`${BASE_URL}/groups/${groupId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not delete group");
      }

      navigate("/groups", { replace: true });
    } catch (err) {
      setDeleteError(err.message || "Could not delete group");
      setDeleting(false);
    }
  };

  const handleRemoveMovie = async (movieId) => {
    if (!group.is_owner || removingMovieId !== null) return;

    setRemovingMovieId(movieId);
    setMovieActionError("");

    try {
      const response = await fetch(`${BASE_URL}/groups/${groupId}/favorites/${movieId}`, {
        method: "DELETE",
        headers: {
          Authorization: `******"token")}`,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not remove movie from group");
      }

      setGroup((currentGroup) => ({
        ...currentGroup,
        favorites: currentGroup.favorites.filter((favorite) => favorite.movie_id !== movieId),
      }));
      setMovies((currentMovies) => currentMovies.filter((movie) => movie.id !== movieId));
      setFailedMovieIds((currentIds) => currentIds.filter((id) => id !== movieId));
    } catch (removeError) {
      setMovieActionError(removeError.message || "Could not remove movie from group");
    } finally {
      setRemovingMovieId(null);
    }
  };

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
          <h1>{error.title}</h1>
          <p>{error.message}</p>
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
        {group.is_owner && (
          <button
            type="button"
            className="group-details-delete"
            onClick={() => {
              setDeleteError("");
              setDeleteConfirmation("");
              setDeleteOpen(true);
            }}
            
          >
            Delete group
          </button>
        )}
        {deleteError && <p role="alert">{deleteError}</p>}
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
              {movieActionError && (
                <p className="favourites-action-error" role="alert">
                  {movieActionError}
                </p>
              )}
              {failedMovieIds.length > 0 && (
                <p className="favourites-partial-warning">
                  Some group movies are temporarily unavailable.
                </p>
              )}
              <FavoriteMovieList
                movies={visibleMovies}
                failedMovieIds={visibleFailedMovieIds}
                onRemove={group.is_owner ? handleRemoveMovie : undefined}
                removingMovieId={removingMovieId}
              />
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
            <>
              {movieActionError && (
                <p className="favourites-action-error" role="alert">
                  {movieActionError}
                </p>
              )}
              <p className="group-details-muted">No movies have been added to this group yet.</p>
            </>
          )}
        </section>
      </div>

      <Modal isOpen={deleteOpen} onClose={closeDeleteModal}>
        <form className="auth-form" onSubmit={handleDeleteGroup} noValidate>
          <h2>DELETE GROUP</h2>
          <p className="auth-lead">
            This permanently removes <strong>{group.group_name}</strong> and its group data.
          </p>

          <div className="auth-warning">
            <p>⚠ Group members and group favorites will also be removed.</p>
          </div>

          <input
            type="text"
            placeholder="type DELETE to confirm"
            aria-label="Type DELETE to confirm"
            autoFocus
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
          />

          {deleteError && <p className="auth-error" role="alert">{deleteError}</p>}

          <button
            type="submit"
            className="auth-submit danger"
            disabled={deleteConfirmation !== "DELETE" || deleting}
          >
            {deleting ? "Deleting..." : "🗑 Delete group"}
          </button>

          <p className="auth-switch">
            Changed your mind?{" "}
            <button type="button" onClick={closeDeleteModal} disabled={deleting}>
              Cancel
            </button>
          </p>
        </form>
      </Modal>
    </main>
  );
}

export default GroupDetails;
