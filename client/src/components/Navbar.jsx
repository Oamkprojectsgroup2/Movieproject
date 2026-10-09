import "./styles/Navbar.css";
import { NavLink, useNavigate } from "react-router";
import { useState } from "react";

function Navbar({
  search,
  setSearch,
  setSearchTrigger,
  onLoginClick,
  user,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      navigate("/search");
      setSearchTrigger((current) => current + 1);
      closeMenu();
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
          closeMenu();
        }}
      >
        <span className="title-cine">Cine</span><span className="title-circle">Circle</span>
      </div>
      
      <button
        className="navbar-toggle"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? "X" : "☰"}
      </button>

      {menuOpen && <div className="navbar-backdrop" onClick={closeMenu} />}

      {/* Right side */}

      <div 
        className={`navbar-right ${menuOpen ? "open" : ""}`}
        onClick={(e) => { if (e.target.closest("a")) closeMenu(); }}
      >

        {/* Small search */}

        <input
          className="navbar-search"
          type="text"
          placeholder="Search"
          value={search}
          aria-label="Search movies"
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
            onClick={() => {
              closeMenu();
              onLoginClick();
            }}
          >
            Login
          </button>
        )}

      </div>

    </nav>
  );
}

export default Navbar;