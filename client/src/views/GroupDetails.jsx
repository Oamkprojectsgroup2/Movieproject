import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { BASE_URL } from "../config";
import "./styles/GroupDetails.css";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <button type="button" className="group-details-back" onClick={() => navigate("/groups")}>
          Back to groups
        </button>
        <section className="group-details-state group-details-state-error" role="alert">
          <h1>{error.title}</h1>
          <p>{error.message}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="group-details-page">
      <button type="button" className="group-details-back" onClick={() => navigate("/groups")}>
        Back to groups
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
            <ul className="group-details-members">
              {group.members.map((member) => (
                <li key={member.user_id}>{member.user_name}</li>
              ))}
            </ul>
          ) : (
            <p className="group-details-muted">No accepted members yet.</p>
          )}
        </section>

        <section className="group-details-section">
          <h2>Group favorites</h2>
          {group.favorites.length > 0 ? (
            <ul className="group-details-favorites">
              {group.favorites.map((favorite) => (
                <li key={favorite.movie_id}>
                  Movie {favorite.movie_id}
                  {favorite.added_by ? ` · added by ${favorite.added_by}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="group-details-muted">No movies have been added to this group yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}

export default GroupDetails;
