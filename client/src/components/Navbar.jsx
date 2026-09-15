import "../styles/Navbar.css";
import { useNavigate } from "react-router";

function Navbar({
  search,
  setSearch,
  setSearchTrigger,
  siteLanguage,
  setSiteLanguage,
  onLoginClick,
  user,
  onLogout,
}) {
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      navigate("/search");
      setSearchTrigger((current) => current + 1);
    }
  };


  return (
    <nav className="navbar">

      {/* Logo */}

      <div
        className="logo"
          onClick={() => {
          setSearch("");
          navigate("/");
        }}
      >
        <h2 className="logo">
          <span className="title-cine">Cine</span><span className="title-circle">Circle</span>
        </h2>
      </div>


      {/* Right side */}

      <div className="navbar-right">

        {/* Small search */}

        <input
          className="nav-search"
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearch}
        />


        <button
          onClick={() => navigate("/theaters")}
          >
          In Theaters
        </button>

        <button>
          Favourites
        </button>

        <button>
          Groups
        </button>

        {user ? (
          <>
            <span className="nav-user">{user.username}</span>

            <button onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <button
            className="nav-login"
            onClick={onLoginClick}
          >
            Login
          </button>
        )}

        <select value={siteLanguage} onChange={(e) => setSiteLanguage(e.target.value)}>
          <option value="en-US">English</option>
          <option value="fi-FI">Suomi</option>
        </select>

      </div>

    </nav>
  );
}

export default Navbar;