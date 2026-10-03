import { useEffect, useState } from "react";
import { BASE_URL } from "../config";
import "./styles/ManageForm.css";

const loadMembers  = async (groupId, setMembers, setError, setLoading) => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch(`${BASE_URL}/groups/pending/${groupId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Fetching members failed");
    }
    setMembers(result.data || []);
  }
  catch (error) {
    setError(error.message);
  }
  finally {
    setLoading(false);
  }
}

export default function ManageForm({groupId,  groupName, onClose}) {
  const [error, setError] = useState(null);
  const [decisionError, setDecisionError] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId) {
      loadMembers(groupId, setMembers, setError, setLoading)
    }
  }, [groupId]);

  const handleDecision = async (userId, groupId, decision) => {
    setDecisionError(null);
    try {
      let response;
      if (decision === "accept") {
        response = await fetch(`${BASE_URL}/groups/accept/${groupId}/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      }
      if (decision === "reject") {
        response = await fetch(`${BASE_URL}/groups/reject/${groupId}/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      }
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Members status update failed");
      }
      setMembers((prevMembers) =>
        prevMembers.filter((member) => member.user_id !== userId)
      );
    }
    catch (error) {
      setDecisionError(error.message);
    }
  };

  return (
    <div className="members-container">
      <h2>Manage Memberships for {groupName}</h2>
      {loading && <p>Loading members</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && members.length === 0 && <p>No pending members</p>}
      {!loading && !error && members.length > 0 && (
        <ul className="members-pending-list">
          {members.map((member) => (
            <li key={member.user_id} className="member-pending-item">
              <div className="member-pending-info">
                <span className="member-name">{member.user_name}</span>
                <span className="member-status">{member.status}</span>
              </div>

              <div className="members-pending-buttons">
                <button
                  type="primary"
                  className="members-pending-btn-accept"
                  onClick={() => handleDecision(member.user_id, groupId, "accept")}
                >
                  Accept
                </button>
                <button
                  type="primary"
                  className="members-pending-btn-reject"
                  onClick={() => handleDecision(member.user_id, groupId, "reject")}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
        )}
    </div>
  );
}
