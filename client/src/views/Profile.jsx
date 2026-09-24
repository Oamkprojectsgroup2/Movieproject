import { useEffect, useState } from "react";
import { Link } from "react-router";
import Modal from "../components/Modal";
import DeleteForm from "../components/DeleteForm";
import { BASE_URL } from "../config";
import "./styles/Profile.css";

//todo: replace with API data

const reviews = [
  { id: 1, title: "First movie", stars: 4, createdAt: "2026-09-15" },
  { id: 2, title: "Second movie", stars: 3, createdAt: "2026-09-10" },
  { id: 3, title: "Third movie", stars: 5, createdAt: "2026-08-27" },
];
const groups = [
  { id: 1, name: "Men over 40", role: "owner", pendingRequests: 2 },
  { id: 2, name: "Murder mysteries for wife's", role: "member" },
  { id: 3, name: "Anime lovers", role: "pending" }
];

function timeAgo(date) {
  const days = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (days < 7) return `${days} d ago`;
  return `${Math.floor(days / 7)} w ago`;
}

function Stars({ count }) {
  return (
    <span className="profile-stars" aria-label={`${count} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= count ? "star-on" : "star-off"}>★</span>
      ))}
    </span>
  );
}

function Profile({ user, onLogout, onDeleteAccount }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [favorites, setFavorites] = useState({ total: 0, posters: [], shareUrl: "" });
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoritesError, setFavoritesError] = useState(null);
  const [shareMessage, setShareMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      try {
        const response = await fetch(`${BASE_URL}/favorites`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Favorites could not be loaded");
        }

        const movieIds = (data.favorites || []).map((favorite) => favorite.movie_id);
        const details = await Promise.allSettled(
          movieIds.slice(0, 3).map(async (movieId) => {
            const movieResponse = await fetch(`${BASE_URL}/movies/${movieId}?language=en-US`);
            if (!movieResponse.ok) {
              throw new Error("Movie details could not be loaded");
            }
            return movieResponse.json();
          }),
        );

        if (!cancelled) {
          setFavorites({
            total: movieIds.length,
            posters: details
              .filter((result) => result.status === "fulfilled")
              .map((result) => result.value.poster_path),
            shareUrl: "",
          });
        }
      } catch (error) {
        if (!cancelled) {
          setFavoritesError(error.message);
        }
      } finally {
        if (!cancelled) {
          setFavoritesLoading(false);
        }
      }
    }

    loadFavorites();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleShare = async () => {
    setShareMessage(null);

    try {
      const response = await fetch(`${BASE_URL}/favorites/share`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Sharing could not be enabled");
      }

      const shareUrl = `${window.location.origin}/favourites/share/${data.shared_token}`;
      setFavorites((current) => ({ ...current, shareUrl }));

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage("Link copied to clipboard");
      } else {
        setShareMessage("Share link ready to copy");
      }
    } catch (error) {
      setShareMessage(error.message);
    }
  };

  const hiddenFavorites = Math.max(favorites.total - favorites.posters.length, 0);

  return (
    <main className="profile-page">
      <header className="profile-header">
        <div className="profile-avatar">{user.user_name[0]}</div>
        <div className="profile-identity">
          <h1>{user.user_name}</h1>
          <p>{reviews.length} reviews · {favoritesLoading ? "..." : favorites.total} favorites · {groups.length} groups</p>
        </div>
        <button className="btn-outline" onClick={onLogout}>Log out</button>
      </header>

      <div className="profile-grid">
        <section className="profile-card">
          <div className="profile-card-head">
            <h2>Your reviews</h2>
            <Link to="/reviews">See all</Link>
          </div>
          <ul className="profile-list">
            {reviews.map((r) => (
              <li key={r.id}>
                <div>
                  <span className="profile-item-title">{r.title}</span>
                  <Stars count={r.stars} />
                </div>
                <span className="profile-meta">{timeAgo(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="profile-card">
          <div className="profile-card-head">
            <h2>Your favorites</h2>
            <div className="profile-card-actions">
              <Link to="/favourites" className="profile-favorites-link">Open list</Link>
              <button className="btn-primary profile-share" onClick={handleShare}>Share list</button>
            </div>
          </div>
          <div className="profile-posters">
            {favorites.posters.map((poster, i) => (
              <div key={i} className="profile-poster">
                {poster && <img src={`https://image.tmdb.org/t/p/w342${poster}`} alt="" />}
              </div>
            ))}
            {hiddenFavorites > 0 && <div className="profile-poster more">+{hiddenFavorites}</div>}
          </div>
          <p className={`profile-url${favoritesError ? " error" : ""}`}>
            {favoritesError || favorites.shareUrl || "Sharing is off"}
          </p>
          {shareMessage && <p className="profile-share-message">{shareMessage}</p>}
        </section>

        <section className="profile-card wide">
          <div className="profile-card-head">
            <h2>Your groups</h2>
            <button className="link-button">Create group</button>
          </div>
          <ul className="profile-list">
            {groups.map((g) => (
              <li key={g.id}>
                <span>
                  <span className="profile-item-title">{g.name}</span>
                  <span className="profile-meta"> · {g.role}</span>
                </span>
                {g.role === "owner" && g.pendingRequests > 0 && (
                  <button className="link-button warning">🔔 {g.pendingRequests} requests waiting</button>
                )}
                {g.role === "member" && <button className="link-button">Leave</button>}
                {g.role === "pending" && <button className="link-button">Cancel request</button>}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="profile-danger">
        <button className="btn-outline muted" onClick={() => setDeleteOpen(true)}>
          🗑 Delete account
        </button>
      </div>

      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DeleteForm
          onSubmit={onDeleteAccount}
          onCancel={() => setDeleteOpen(false)}
        />
      </Modal>
    </main>
  );
}

export default Profile;
