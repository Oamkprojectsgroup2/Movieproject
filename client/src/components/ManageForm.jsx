import { useEffect, useState } from "react";
import { BASE_URL } from "../config";
import "./styles/ManageForm.css";

const loadMembers  = async (groupId, setMembers, setError, setLoading) => {
  setError(null);
  
  try {
    const response = await fetch(`${BASE_URL}/groups/memberList/${groupId}`, {
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

export default function ManageForm({groupId,  groupName, groupOwnerId, refresh}) {
  const [error, setError] = useState(null);
  const [decisionError, setDecisionError] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending');

  useEffect(() => {
    if (groupId) {
      loadMembers(groupId, setMembers, setError, setLoading)
    }
  }, [groupId]);

  const handleDecision = async (userId, groupId, decision) => {
    setDecisionError(null);
    try {
      let response;
      if (decision === "accepted") {
        response = await fetch(`${BASE_URL}/groups/accept/${groupId}/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      }
      if (decision === "rejected") {
        response = await fetch(`${BASE_URL}/groups/reject/${groupId}/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      }
      if (decision === 'remove') {
         response = await fetch(`${BASE_URL}/groups/remove/${groupId}/${userId}`, {
          method: "DELETE",
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
      setMembers((prevMembers) => {
        if (decision === 'remove') {
          //removes removed members from local members also
          return prevMembers.filter((member) => member.user_id !== userId);
        }
        else {
          return prevMembers.map((member) => member.user_id === userId ? {...member, status: decision} : member)
        }
      });
      refresh();
    }
    catch (error) {
      setDecisionError(error.message);
    }
  };

  return (
    <div className="members-container">
      <div className="members-container-header">
        <h2>Manage Memberships for {groupName}</h2>
        <div className="status-selection-buttons">
          <button
            type="primary"
            className="member-select-accepted"
            onClick={() => { setSelectedStatus('accepted') }}
            disabled={selectedStatus === 'accepted'}
          >
            Accepted
          </button>
          <button
            type="primary"
            className="member-select-pending"
            onClick={() => { setSelectedStatus('pending') }}
            disabled={selectedStatus === 'pending'}
          >
            Pending
          </button>
          <button
            type="primary"
            className="member-select-rejected"
            onClick={() => { setSelectedStatus('rejected') }}
            disabled={selectedStatus === 'rejected'}
          >
            Rejected
          </button>
        </div>
      </div>
      {loading && <p>Loading members</p>}
      {decisionError && <p className="error" role="alert">{decisionError}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && !error && members.filter(member => (member.user_id !== groupOwnerId && member.status === selectedStatus)).length === 0 && <p>No {selectedStatus} members</p>}
      {!loading && !error && members.length > 0 && (
        <ul className="members-status-list">
          {members.filter((member) => (member.user_id !== groupOwnerId && member.status === selectedStatus)).map((member) => (
            <li key={member.user_id} className="member-status-item">
              <div className="member-status-info">
                <span className="member-name">{member.user_name}</span>
                <span className="member-status">{member.status}</span>
              </div>

              <div className="members-status-buttons">
                {selectedStatus !== 'accepted' && <button
                  type="primary"
                  className="members-status-btn-accept"
                  onClick={() => {handleDecision(member.user_id, groupId, "accepted")}}
                >
                  Accept
                </button>}
                <button
                  type="primary"
                  className="members-status-btn-remove"
                  onClick={() => {handleDecision(member.user_id, groupId, "remove")}}
                >
                  Remove
                </button>
                {selectedStatus !== 'rejected' && <button
                  type="primary"
                  className="members-status-btn-reject"
                  onClick={() => {handleDecision(member.user_id, groupId, "rejected")}}
                >
                  Reject
                </button>}
              </div>
            </li>
          ))}
        </ul>
        )}
    </div>
  );
}
