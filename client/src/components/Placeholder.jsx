import "./styles/Placeholder.css";

function Placeholder({ title, message = "This page is not built yet." }) {
  return (
    <main className="placeholder-page">
      <h1 className="placeholder-title">{title}</h1>
      <p className="placeholder-message">{message}</p>
    </main>
  );
}

export default Placeholder;