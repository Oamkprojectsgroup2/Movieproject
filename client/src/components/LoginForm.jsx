import "../styles/Login.css";

function LoginForm() {
  return (
    <>
      <div className="login-info">
        <h2>LOGIN</h2>
        <input type="text" placeholder="username" />
        <input type="password" placeholder="password" />
      </div>

      <button className="login">Login</button>
    </>
  );
}

export default LoginForm;
