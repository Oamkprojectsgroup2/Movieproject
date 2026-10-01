import { useEffect, useState } from "react";
import { BASE_URL } from "../config";
import Modal from "./Modal";
import "../components/styles/GroupMoviePicker.css";
import { isAcceptedMember } from "../../../server/src/helper/groupMembership";

function GroupMoviePicker({ isOpen, movieId, onClose }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;

    async function loadGroups() {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const response = await fetch(`${BASE_URL}/groups`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Groups could not be loaded");
        }

        if (!cancelled) {
          setGroups(
            (data.groups || []).filter((group) => isAcceptedMember(group.my_status),
            ),
          );
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
  }, [isOpen, movieId]);

  const addMovieToGroup = async (group) => {
    setAdding(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `${BASE_URL}/groups/${group.group_id}/favorites`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ movie_id: Number(movieId) }),
        },
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Movie could not be added to the group");
      }

      setMessage(
        data.added
          ? `Added to "${group.group_name}".`
          : `Already in "${group.group_name}".`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <section
        className="group-movie-picker"
        aria-labelledby="group-movie-picker-title"
      >
        <h2 id="group-movie-picker-title">
          ADD TO GROUP
        </h2>

        {error && <p role="alert" className="group-movie-picker-error">{error}</p>}

        {loading ? (
          <p>Loading groups...</p>
        ) : groups.length > 0 ? (
          <ul className="group-movie-picker-list">
            {groups.map((group) => (
              <li key={group.group_id}>
                <button
                  type="button"
                  className="group-movie-picker-button"
                  disabled={adding}
                  onClick={() => addMovieToGroup(group)}
                >
                  {group.group_name}
                </button>
              </li>
            ))}
          </ul>
        ) : !error ? (
          <p>You are not a member of any groups yet.</p>
        ) : null}

        {message && (
          <p role="status" className="group-movie-picker-status">
            {message}
          </p>
        )}
      </section>
    </Modal>
  );
}

export default GroupMoviePicker;