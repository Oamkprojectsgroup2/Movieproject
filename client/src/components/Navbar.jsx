import "../styles/Navbar.css";
import { NavLink, useNavigate } from "react-router";

function Navbar({
  search,
  setSearch,
  setSearchTrigger,
  siteLanguage,
  setSiteLanguage,
  onLoginClick,
  user,
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
        <span className="title-cine">Cine</span><span className="title-circle">Circle</span>
      </div>


      {/* Right side */}

      <div className="navbar-right">

        {/* Small search */}

        <input
          className="navbar-search"
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearch}
        />



        <div className="navbar-links">
          <NavLink to="/theaters">In Theaters</NavLink>
          <NavLink to="/favourites">Favourites</NavLink>
          <NavLink to="/groups">Groups</NavLink>
        </div>

        {user ? (
          <div className="navbar-links">
            <NavLink to="/profile" className="navbar-username" title={user.user_name}>
              {user.user_name}
            </NavLink>
          </div>
        ) : (
          <button
            className="navbar-login btn-primary"
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