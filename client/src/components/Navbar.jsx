import "../styles/Navbar.css";

function Navbar({
  currentPage,
  setCurrentPage,
  search,
  setSearch,
  setSearchTrigger,
  siteLanguage,
  setSiteLanguage,
  onLoginClick,
}) {

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setCurrentPage("search");
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
          setCurrentPage("home")
        }}
      >
        <span>🖼️</span>
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
          onClick={() => setCurrentPage("theaters")}
          >
          In Theaters
        </button>

        <button>
          Favourites
        </button>

        <button>
          Groups
        </button>

        <button
          onClick={onLoginClick}
          >
          Login
        </button>

        <select value={siteLanguage} onChange={(e) => setSiteLanguage(e.target.value)}>
          <option value="en-US">English</option>
          <option value="fi-FI">Suomi</option>
        </select>

      </div>

    </nav>
  );
}

export default Navbar;