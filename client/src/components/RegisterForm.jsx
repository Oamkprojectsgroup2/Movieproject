import { useState } from "react";
import "../styles/Auth.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ username, email, password, confirmPassword }) {
  if (!username.trim() || !email.trim() || !password || !confirmPassword) {
    return "Please fill in all fields.";
  }

  if (username.trim().length < 3 || username.trim().length > 25) {
    return "Username must be 3–25 characters.";
  }

  if (!EMAIL_PATTERN.test(email.trim())) {
    return "Please enter a valid email address.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

      //Should test all unicode characters
  if (!/\p{Lu}/u.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }

  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}

function RegisterForm({ onSubmit, onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate({
      username,
      email,
      password,
      confirmPassword,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        user_name: username.trim(),
        email: email.trim(),
        password,
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>

      <h2>SIGN UP</h2>

      <input
        type="text"
        placeholder="username"
        aria-label="Username"
        autoComplete="username"
        maxLength={25}
        autoFocus
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="email"
        placeholder="email"
        aria-label="Email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="password"
        aria-label="Password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="password"
        placeholder="confirm password"
        aria-label="Confirm password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      {error && (
        <p className="auth-error" role="alert">{error}</p>
      )}

      <button type="submit" className="auth-submit" disabled={loading}>
        {loading ? "Creating account..." : "Sign up"}
      </button>

      <p className="auth-switch">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin}>
          Login
        </button>
      </p>

    </form>
  );
}

export default RegisterForm;
