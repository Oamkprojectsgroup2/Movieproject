import { useState } from "react";
import "../styles/Auth.css";

function DeleteForm({ onSubmit, onCancel }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = password && confirm === "DELETE";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    setLoading(true);
    setError(null);
    try {
      await onSubmit({ password });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>

      <h2>DELETE ACCOUNT</h2>
      <p className="auth-lead">
        This permanently removes your account and everything you've made.
      </p>

      <div className="auth-warning">
        <p>⚠ This also removes your reviews, favourites and group memberships.</p>
      </div>

      <input
        type="password"
        placeholder="password"
        aria-label="Password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="text"
        placeholder="type DELETE to confirm"
        aria-label="type DELETE to confirm"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      {error && (<p className="auth-error">{error}</p>)}

      <button type="submit" className="auth-submit danger" disabled={!canSubmit || loading}>
        {loading ? "Deleting.." : "🗑 Delete my account"}
      </button>

      <p className="auth-switch">
        Changed your mind? <button type="button" onClick={onCancel}>Cancel</button>
      </p>

    </form>
  );
}

export default DeleteForm;
