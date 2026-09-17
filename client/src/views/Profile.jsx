import { Link } from "react-router";
import "../styles/Profile.css";

//todo: replace with API data
const reviews = [
  { id: 1, title: "First movie", stars: 4, createdAt: "2026-09-15" },
  { id: 2, title: "Second movie", stars: 3, createdAt: "2026-09-10" },
  { id: 3, title: "Third movie", stars: 5, createdAt: "2026-08-27" },
];
const favorites = { total: 22, posters: [null, null, null], shareUrl: "dippadai.fin/kdsosmngv" };
const groups = [
  { id: 1, name: "Men over 40", role: "owner", pendingRequests: 2 },
  { id: 2, name: "Murder mysteries for wife's", role: "member" },
  { id: 3, name: "Anime lovers", role: "pending" }
];
const hiddenFavorites = favorites.total - favorites.posters.length;

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

function Profile({ user, onLogout }) {
  return (
    <main className="profile-page">
      <header className="profile-header">
        <div className="profile-avatar">{user.user_name[0]}</div>
        <div className="profile-identity">
          <h1>{user.user_name}</h1>
          <p>{reviews.length} reviews · {favorites.total} favorites · {groups.length} groups</p>
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
            <button className="btn-primary profile-share">Share list</button>
          </div>
          <div className="profile-posters">
            {favorites.posters.map((poster, i) => (
              <div key={i} className="profile-poster" />
            ))}
            {hiddenFavorites > 0 && <div className="profile-poster more">+{hiddenFavorites}</div>}
          </div>
          <p className="profile-url">{favorites.shareUrl}</p>
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
        {/* TODO (#23): open confirm dialog */}
        <button className="btn-outline muted">🗑 Delete account</button>
      </div>
    </main>
  );
}

export default Profile;
