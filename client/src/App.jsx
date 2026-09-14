import { useState } from "react";

import Navbar from "./components/Navbar";
import Home from "./views/Home";
import Search from "./views/Search";

import "./App.css";

const BASE_URL = "http://localhost:3001/api";


function App() {

  const [currentPage, setCurrentPage] = useState("home");

  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [language, setLanguage] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [siteLanguage, setSiteLanguage] = useState("en-US");


  return (
    <div className="app">

      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        search={search}
        setSearch={setSearch}
        setSearchTrigger={setSearchTrigger}
        siteLanguage={siteLanguage}
        setSiteLanguage={setSiteLanguage}
      />


      {currentPage === "home" && (
        <Home
          search={search}
          setSearch={setSearch}

          genre={genre}
          setGenre={setGenre}

          year={year}
          setYear={setYear}

          language={language}
          setLanguage={setLanguage}

          setCurrentPage={setCurrentPage}
        />
      )}


      {currentPage === "search" && (
        <Search
          search={search}
          setSearch={setSearch}

          genre={genre}
          setGenre={setGenre}

          year={year}
          setYear={setYear}

          language={language}
          setLanguage={setLanguage}
          searchTrigger={searchTrigger}

          siteLanguage={siteLanguage}
        />
      )}

    </div>
  );
}

export default App;