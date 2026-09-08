import { useState, useEffect } from 'react';

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for search input and result context label
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSource, setCurrentSource] = useState('');

  // Fetch Now Playing Movies
  const fetchNowPlaying = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/movies/nowplaying');
      if (!response.ok) throw new Error('Failed to fetch now playingmovies');
      
      const data = await response.json();
      setMovies(data.results || []);
      setCurrentSource('Now Playing Movies');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Search Movies Handler
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/movies/search?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setMovies(data.results || []);
      setCurrentSource(`Search Results for "${searchQuery}"`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  //Fetch Popular Movies
  const fetchPopular = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/movies/popular');
      if (!response.ok) throw new Error('Failed to fetch popular movies');

      const data = await response.json();
      setMovies(data.results || []);
      setCurrentSource('Popular Movies');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  //Fetch Top Rated Movies
  const fetchTopRated = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/movies/top_rated');
      if (!response.ok) throw new Error('Failed to top rated movies');

      const data = await response.json();
      setMovies(data.results || []);
      setCurrentSource('Top Rated Movies');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  //Fetch Upcoming Movies
  const fetchUpcoming = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/movies/upcoming');
      if (!response.ok) throw new Error('Failed to upcoming movies');

      const data = await response.json();
      setMovies(data.results || []);
      setCurrentSource('Upcoming Movies');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch default movies on initial load
  useEffect(() => {
    fetchNowPlaying();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Movie Explorer</h1>

      {/* Search Bar & Controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flexGrow: 1 }}>
          <input
            type="text"
            placeholder="Search for a movie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '1rem', flexGrow: 1 }}
          />
          <button type="submit" style={{ padding: '8px 16px', fontSize: '1rem', cursor: 'pointer' }}>
            Search
          </button>
        </form>

        <button 
          onClick={() => { setSearchQuery(''); fetchNowPlaying(); }} 
          style={{ padding: '8px 16px', fontSize: '1rem', cursor: 'pointer' }}
        >
          Reset to Now Playing
        </button>
        <button
          onClick={() => { setSearchQuery(''); fetchPopular(); }}
          style={{ padding: '8px 16px', fontSize: '1rem', cursor: 'pointer' }}
        >
          Popular
        </button>
        <button
          onClick={() => { setSearchQuery(''); fetchTopRated(); }}
          style={{ padding: '8px 16px', fontSize: '1rem', cursor: 'pointer' }}
        >
          Top Rated
        </button>
        <button
          onClick={() => { setSearchQuery(''); fetchUpcoming(); }}
          style={{ padding: '8px 16px', fontSize: '1rem', cursor: 'pointer' }}
        >
          Upcoming
        </button>
      </div>

      {/* Dynamic API Context Indicator */}
      {currentSource && !loading && !error && (
        <h2 style={{ color: '#555', fontSize: '1.2rem', marginBottom: '16px' }}>
          Showing: <strong>{currentSource}</strong> ({movies.length} results)
        </h2>
      )}

      {/* UI State Feedback */}
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Movie Results List */}
      {!loading && !error && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {movies.length > 0 ? (
            movies.map((movie) => (
              <li 
                key={movie.id} 
                style={{ 
                  padding: '10px 0', 
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span><strong>{movie.title}</strong></span>
                <span style={{ color: '#888' }}>{movie.release_date?.slice(0, 4) || 'N/A'}</span>
              </li>
            ))
          ) : (
            <p>No movies found.</p>
          )}
        </ul>
      )}
    </div>
  );
}

export default App;