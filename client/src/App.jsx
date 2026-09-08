import { useState, useEffect } from 'react';

const BASE_URL = "http://localhost:3001/api";

const LANGUAGES = [
  { code: 'fi-FI', label: 'Suomi 🇫🇮' },
  { code: 'en-US', label: 'English (US) 🇺🇸' },
  { code: 'sv-SE', label: 'Svenska 🇸🇪' },
  { code: 'de-DE', label: 'Deutsch 🇩🇪' },
  { code: 'fr-FR', label: 'Français 🇫🇷' },
  { code: 'es-ES', label: 'Español 🇪🇸' },
  { code: 'ja-JP', label: '日本語 🇯🇵' },
  { code: 'ko-KR', label: '한국어 🇰🇷' },
  { code: 'hi-IN', label: 'हिन्दी 🇮🇳' },
  { code: 'pt-BR', label: 'Português (BR) 🇧🇷' }
];

const REGIONS = [
  { code: 'FI', label: 'Finland 🇫🇮' },
  { code: 'US', label: 'United States 🇺🇸' },
  { code: 'GB', label: 'United Kingdom 🇬🇧' },
  { code: 'FR', label: 'France 🇫🇷' },
  { code: 'DE', label: 'Germany 🇩🇪' },
  { code: 'JP', label: 'Japan 🇯🇵' },
  { code: 'KR', label: 'South Korea 🇰🇷' },
  { code: 'IN', label: 'India 🇮🇳' },
  { code: 'BR', label: 'Brazil 🇧🇷' },
];

const REGION_TO_LANGUAGE = {
  FI: 'fi-FI',
  US: 'en-US',
  GB: 'en-US',
  FR: 'fr-FR',
  DE: 'de-DE',
  JP: 'ja-JP',
  KR: 'ko-KR',
  IN: 'hi-IN',
  BR: 'pt-BR',
};

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("fi-FI");
  const [region, setRegion] = useState("FI");
  
  const [searchMovieQuery, setSearchMovieQuery] = useState('');
  const [searchTvQuery, setSearchTvQuery] = useState('');
  const [currentSource, setCurrentSource] = useState('');
  const [activeRequest, setActiveRequest] = useState({
    endpoint: '/movies/nowplaying',
    label: 'Now Playing Movies'
  });

  const handleRegionChange = (e) => {
  const newRegion = e.target.value;
  setRegion(newRegion);

  // Automatically update language if a mapping exists
  const autoLanguage = REGION_TO_LANGUAGE[newRegion];
  if (autoLanguage) {
    setLanguage(autoLanguage);
  }
};

  // 1. Generic Fetch Helper to eliminate duplicate try/catch code
  const fetchData = async (endpoint, sourceLabel) => {
    setLoading(true);
    setError(null);
    setActiveRequest({ endpoint, label: sourceLabel });
    try {
      const separator = endpoint.includes('?') ? '&' : '?';
      const response = await fetch(`${BASE_URL}${endpoint}${separator}language=${language}&region=${region}`);
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
  }, [language, region]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header, Language & Region Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ margin: 0 }}>Movie & Series Explorer</h1>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          {/* Region Dropdown */}
          <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
            Region:{' '}
            <select 
              value={region} 
              onChange={handleRegionChange}
              style={{ padding: '6px 10px', fontSize: '0.9rem', cursor: 'pointer', borderRadius: '4px' }}
            >
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          {/* Language Dropdown */}
          <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
            Language:{' '}
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '0.9rem', cursor: 'pointer', borderRadius: '4px' }}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>
        </div>
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