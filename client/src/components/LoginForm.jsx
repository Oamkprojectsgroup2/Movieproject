import { useState } from "react";
import "./styles/Auth.css";


function LoginForm({ notice, onSubmit, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
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

        <h2>LOGIN</h2>

        {notice && (
          <p className="auth-success">{notice}</p>
        )}

        <input 
          type="email" 
          placeholder="email"
          aria-label="Email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
        />

        <input 
          type="password" 
          placeholder="password"
          aria-label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
        />

        {error &&(
          <p  className="auth-error" role="alert">{error}</p> 
        )}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Logging in.." : "Login"}
        </button>

        <p className="auth-switch">
          Don't have an account?{" "}
          <button type="button" onClick={onSwitchToRegister}>
            Sign up
          </button>
        </p>
        
    </form>
  );
}

export default LoginForm;
