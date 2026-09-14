import { useState, useEffect } from "react";
import "../styles/SearchFilters.css";

const BASE_URL = "http://localhost:3001/api";

function SearchFilters({
    genre, 
    setGenre, 
    year, 
    setYear, 
    language, 
    siteLanguage = "en-US",
    contentType = "movie", 
    setLanguage, 
    onGenresLoaded,
    className,
    showExtra = true }) 
    {

  const clearFilters = () => {
    setGenre("");
    setYear("");
    setYearInput("");
    setYearError(null);
    setLanguage("");
    setLanguageInput("");
  };

  const [genres, setGenres] = useState([]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const endpoint =
          contentType === "movie"
            ? "/movies/genres"
            : "/tv/genres";

        const response = await fetch(
          `${BASE_URL}${endpoint}?language=${siteLanguage}`
        );

        const data = await response.json();

        setGenres(data.genres || []);
        onGenresLoaded?.(data.genres || []);
      } catch (err) {
        setGenres([]);
      }
    };

    fetchGenres();
  }, [contentType, siteLanguage]);

    const [languages, setLanguages] = useState([]);
  
    useEffect(() => {
      const fetchLanguages = async () => {
        try {
          const response = await fetch(`${BASE_URL}/config/languages`);
          const data = await response.json();
          setLanguages(data || []);
        } catch (err) {
          setLanguages([]);
        }
      };
  
      fetchLanguages();
    }, []);

      const [yearInput, setYearInput] =useState("");
      const [yearError, setYearError] = useState(null);
    
      const handleYearInput = (value) => {
        setYearInput(value);
    
        if (!value) {
          setYearError(null);
          setYear("");
          return;
        }
    
        const currentMax = new Date().getFullYear() + 10;
        const numericValue = Number(value);
    
        if (!/^\d{4}$/.test(value) || numericValue < 1900 || numericValue > currentMax) {
          setYearError(`Enter a year between 1900 and ${currentMax}`);
          setYear("");
          return;
        }
    
        setYearError(null);
        setYear(value);
      };

        const [languageInput, setLanguageInput] = useState("");
      
        const handleLanguageInput = (e) => {
          setLanguageInput(e);
          const match = languages.find(
            (l) => l.english_name.toLowerCase() === e.toLowerCase()
          );
          setLanguage(match ? match.iso_639_1 : "");
        };

    return(

        <aside className={`search-filters${className ? ` ${className}` : ""}`}>
        
            {showExtra && (
            <h2>
                Filters
            </h2>
            )}


          <div className="search-filter">

            <label htmlFor="search-genre">
              Genre
            </label>

            <select
              id="search-genre"
              value={genre}
              onChange={(e) =>
                setGenre(e.target.value)
              }
            >

              <option value="">
                Any
              </option>

              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

          </div>


          <div className="search-filter">

            <label htmlFor="search-year">
              Year
            </label>
            
            <input
              id="search-year"
              type="number"
              placeholder="any"
              min="1900"
              max={new Date().getFullYear() + 10}
              value={yearInput}
              onChange={(e) =>
                handleYearInput(e.target.value)
              }
            />
            {yearError && (
              <p className="field-error">{yearError}</p>
            )}
          </div>

          <div className="search-filter">

            <label htmlFor="search-language">
              Language
            </label>

          <input
            id="search-language"
            list="language-options"
            type="text"
            placeholder="Any"
            value={languageInput}
            onChange={(e) => handleLanguageInput(e.target.value)}
          />

          <datalist id="language-options">
            {languages.map((lang) => (
              <option key={lang.iso_639_1} value={lang.english_name} />
            ))}
          </datalist>


          </div>

        {showExtra && (
          <button
            className="clear-filters"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        )}
        </aside>
    );
}

export default SearchFilters;