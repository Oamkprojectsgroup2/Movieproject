import { useEffect, useState } from "react";
import { Link } from "react-router";
import Modal from "../components/Modal";
import CreateGroupForm from "../components/CreateGroupForm";
import { BASE_URL } from "../config";
import "./styles/Groups.css";

function memberText(count) {
  return `${count} ${count === 1 ? "member" : "members"}`;
}

function Groups({ user, onLoginClick }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  useEffect(() => {
    let cancelled = false;

    async function loadGroups() {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/groups`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json().catch(() => ({}));

        if(!response.ok) {
          throw new Error(data.message || "Groups could not be loaded");
        }

        if(!cancelled) {
          setGroups(data.groups || []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGroups();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleCreateGroup = async (values) => {
    const response = await fetch(`${BASE_URL}/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(values),
    });

    const data = await response.json().catch(() => ({}));

    if(!response.ok) {
      throw new Error(data.message || "Could not create group");
    }
    const newGroup = { 
      ...data.group, 
      owner_name: user.user_name, 
      member_count: 1,
      my_status: "accepted",
    };
    setGroups((current) =>
      [...current, newGroup].sort((a, b) => a.group_name.localeCompare(b.group_name)),
    );
    setIsCreateOpen(false);
  };

  const isOwner = (group) => user && group.owner_id === user.user_id;
  const query = search.trim().toLowerCase();
  const visibleGroups = groups.filter((group) =>
    group.group_name.toLowerCase().includes(query),
  );
  const myGroups = groups.filter((group) => group.my_status === "accepted");


  return (
    <div className="groups-page">
      <div className="groups-layout">

        <section className="groups-browse">
          <h1 className="groups-heading">Browse groups</h1>

          <input
            className="groups-search"
            type="search"
            placeholder="Search groups by name"
            aria-label="Search groups by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loading && <p className="groups-status">Loading groups..</p>}
          {error && <p className="groups-status" role="alert">{error}</p>}
          {!loading && !error && groups.length === 0 && (
            <p className="groups-status">No groups yet. Create the first one!</p>
          )}
          {!loading && groups.length > 0 && visibleGroups.length === 0 && (
            <p className="groups-status">No groups match "{search.trim()}".</p>
          )}

          <ul className="groups-list">
            {visibleGroups.map((group) => (
              <li key={group.group_id} className="groups-card">
                <div className="groups-card-info">
                  <h2 className="groups-card-name">
                    {group.group_name}
                    {isOwner(group) ? (
                      <span className="groups-badge owner">Owner</span>
                    ) : group.my_status === "accepted" && (
                      <span className="groups-badge member">Member</span>
                    )}
                  </h2>
                  <p className="groups-card-meta">
                    {memberText(group.member_count)} · created by {group.owner_name}
                  </p>
                </div>

                <Link to={`/groups/${group.group_id}`} className="btn-outline groups-card-action">
                  Open group
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <aside className="groups-panel">
          <h2 className="groups-heading small">My groups</h2>

          {user ? (
            myGroups.length > 0 ? (
              <ul className="groups-mine">
                {myGroups.map((group) => (
                  <li key={group.group_id}>
                    <Link to={`/groups/${group.group_id}`} className="groups-mine-item">
                      <span className="groups-mine-name">{group.group_name}</span>
                      <span className="groups-mine-meta">
                        {memberText(group.member_count)}
                        {isOwner(group) && " · owner"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="groups-status">You haven't joined any groups yet.</p>
            )
          ) : (
            <p className="groups-status">Log in to create and join groups.</p>
          )}

          <button
            className="btn-primary groups-create"
            onClick={() => (user ? setIsCreateOpen(true) : onLoginClick())}
          >
            {user ? "+ Create group" : "Login"}
          </button>
        </aside>

      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <CreateGroupForm onSubmit={handleCreateGroup} />
      </Modal>
    </div>
  );
}

export default Groups;
