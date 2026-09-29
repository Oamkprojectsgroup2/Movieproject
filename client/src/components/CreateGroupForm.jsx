import { useState } from "react";
import "./styles/Auth.css";

function CreateGroupForm({ onSubmit }) {
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if(!groupName.trim()) {
      setError("Please enter a group name.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({ group_name: groupName.trim() });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h2>CREATE GROUP</h2>

      <input
        type="text"
        placeholder="group name"
        aria-label="Group name"
        autoFocus
        maxLength={50}
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />

      {error && <p className="auth-error" role="alert">{error}</p>}

      <button type="submit" className="auth-submit" disabled={loading}>
        {loading ? "Creating.." : "Create"}
      </button>
    </form>
  );
}

export default CreateGroupForm;