import { useState, useEffect } from 'react';

const BASE_URL = "http://localhost:3001/api";

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("fi-FI");
  
  const [searchMovieQuery, setSearchMovieQuery] = useState('');
  const [searchTvQuery, setSearchTvQuery] = useState('');
  const [currentSource, setCurrentSource] = useState('');
  const [activeRequest, setActiveRequest] = useState({
    endpoint: '/movies/nowplaying',
    label: 'Now Playing Movies'
  });

  // 1. Generic Fetch Helper to eliminate duplicate try/catch code
  const fetchData = async (endpoint, sourceLabel) => {
    setLoading(true);
    setError(null);
    setActiveRequest({ endpoint, label: sourceLabel });
    try {
      const separator = endpoint.includes('?') ? '&' : '?';
      const response = await fetch(`${BASE_URL}${endpoint}${separator}language=${language}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.status_message || `Server error: ${response.status}`);
      }
      
      setItems(data.results || []);
      setCurrentSource(sourceLabel);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Movie Actions
  const fetchNowPlayingMovies = () => fetchData('/movies/nowplaying', 'Now Playing Movies');
  const fetchPopularMovies = () => fetchData('/movies/popular', 'Popular Movies');
  const fetchTopRatedMovies = () => fetchData('/movies/top_rated', 'Top Rated Movies');
  const fetchUpcomingMovies = () => fetchData('/movies/upcoming', 'Upcoming Movies');

  const handleMovieSearch = (e) => {
    e.preventDefault();
    if (!searchMovieQuery.trim()) return;
    fetchData(`/movies/search?query=${encodeURIComponent(searchMovieQuery)}`, `Movie Search: "${searchMovieQuery}"`);
  };

  // TV Series Actions
  const fetchOnTheAirSeries = () => fetchData('/tv/on_the_air', 'On The Air Series');
  const fetchPopularSeries = () => fetchData('/tv/popular', 'Popular Series');
  const fetchTopRatedSeries = () => fetchData('/tv/top_rated', 'Top Rated Series');
  const fetchAiringTodaySeries = () => fetchData('/tv/airing_today', 'Airing Today Series');

  const handleTvSearch = (e) => {
    e.preventDefault();
    if (!searchTvQuery.trim()) return;
    fetchData(`/tv/search?query=${encodeURIComponent(searchTvQuery)}`, `TV Search: "${searchTvQuery}"`);
  };

  useEffect(() => {
    if (activeRequest.endpoint) {
      fetchData(activeRequest.endpoint, activeRequest.label);
    }
  }, [language]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header & Language Chooser */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Movie & Series Explorer</h1>
        
        <label style={{ fontSize: '1rem', fontWeight: 'bold' }}>
          Language: {' '}
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '1rem', cursor: 'pointer' }}
          >
            <option value="fi-FI">Finnish (Suomi)</option>
            <option value="en-US">English (US)</option>
            <option value="sv-SE">Swedish (Svenska)</option>
            <option value="de-DE">German (Deutsch)</option>
            <option value="es-ES">Spanish (Español)</option>
          </select>
        </label>
      </div>

      {/* Movie Controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <form onSubmit={handleMovieSearch} style={{ display: 'flex', gap: '8px', flexGrow: 1 }}>
          <input
            type="text"
            placeholder="Search for a movie..."
            value={searchMovieQuery}
            onChange={(e) => setSearchMovieQuery(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '1rem', flexGrow: 1 }}
          />
          <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>Search</button>
        </form>

        <button onClick={() => { setSearchMovieQuery(''); fetchNowPlayingMovies(); }}>Now Playing</button>
        <button onClick={() => { setSearchMovieQuery(''); fetchPopularMovies(); }}>Popular</button>
        <button onClick={() => { setSearchMovieQuery(''); fetchTopRatedMovies(); }}>Top Rated</button>
        <button onClick={() => { setSearchMovieQuery(''); fetchUpcomingMovies(); }}>Upcoming</button>
      </div>

      {/* TV Series Controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <form onSubmit={handleTvSearch} style={{ display: 'flex', gap: '8px', flexGrow: 1 }}>
          <input
            type="text"
            placeholder="Search for a series..."
            value={searchTvQuery}
            onChange={(e) => setSearchTvQuery(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '1rem', flexGrow: 1 }}
          />
          <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>Search</button>
        </form>

        <button onClick={() => { setSearchTvQuery(''); fetchOnTheAirSeries(); }}>On The Air</button>
        <button onClick={() => { setSearchTvQuery(''); fetchPopularSeries(); }}>Popular</button>
        <button onClick={() => { setSearchTvQuery(''); fetchTopRatedSeries(); }}>Top Rated</button>
        <button onClick={() => { setSearchTvQuery(''); fetchAiringTodaySeries(); }}>Airing Today</button>
      </div>

      {/* Status Header */}
      {currentSource && !loading && !error && (
        <h2 style={{ color: '#555', fontSize: '1.2rem', marginBottom: '16px' }}>
          Showing: <strong>{currentSource}</strong> ({items.length} results)
        </h2>
      )}

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Results List - Handles both Movie (title, release_date) and TV (name, first_air_date) */}
      {!loading && !error && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.length > 0 ? (
            items.map((item) => {
              const displayTitle = item.title || item.name || 'Untitled';
              const displayDate = item.release_date || item.first_air_date || '';
              const year = displayDate ? displayDate.slice(0, 4) : 'N/A';

              return (
                <li 
                  key={item.id} 
                  style={{ 
                    padding: '10px 0', 
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span><strong>{displayTitle}</strong></span>
                  <span style={{ color: '#888' }}>{year}</span>
                </li>
              );
            })
          ) : (
            <p>No results found.</p>
          )}
        </ul>
      )}
    </div>
  );
}

export default App;