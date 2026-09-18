import { useState, useEffect } from "react";
import { Routes, Route, Navigate,  useNavigate } from "react-router";
import Navbar from "./components/Navbar";
import Home from "./views/Home";
import Search from "./views/Search";
import Theaters from "./views/Theaters";
import Modal from "./components/Modal"
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import "./App.css";
import { BASE_URL } from "./config";
import Placeholder from "./components/Placeholder";
import Profile from './views/Profile'

function getTokenExpiry(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).exp * 1000;
  } catch {
    return 0;
  }
}

function App() {

  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [language, setLanguage] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [siteLanguage, setSiteLanguage] = useState("en-US");
  const [authView, setAuthView] = useState(null);
  const [authNotice, setAuthNotice] = useState(null);
  const navigate = useNavigate();
  const closeAuth = () => {
    setAuthView(null);
    setAuthNotice(null);
  };

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!user) return;

    const expiresIn = getTokenExpiry(localStorage.getItem("token")) - Date.now();

    const timer = setTimeout(() => {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }, Math.max(expiresIn, 0));

    return () => clearTimeout(timer);
  }, [user]);

  const handleLogin = async (values) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    setUser(data.user);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    closeAuth();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleDeleteAccount = async ({ password }) => {
    const response = await fetch(`${BASE_URL}/auth/account`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Delete failed");
    }

    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleRegister = async (values) => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    setAuthNotice("Account created. You can now log in.");
    setAuthView("login");
  };

  return (
    <div className="app">

      <Navbar
        search={search}
        setSearch={setSearch}
        setSearchTrigger={setSearchTrigger}
        siteLanguage={siteLanguage}
        setSiteLanguage={setSiteLanguage}
        onLoginClick={() => setAuthView("login")}
        user={user}
      />


      <Routes>
        <Route path="/" element={
          <Home search={search} setSearch={setSearch}
                genre={genre} setGenre={setGenre}
                year={year} setYear={setYear}
                language={language} setLanguage={setLanguage} />
        } />
        <Route path="/search" element={
          <Search search={search} setSearch={setSearch}
                  genre={genre} setGenre={setGenre}
                  year={year} setYear={setYear}
                  language={language} setLanguage={setLanguage}
                  searchTrigger={searchTrigger} siteLanguage={siteLanguage} />
        } />
        <Route path="/theaters" element={<Theaters />} />
        <Route path="/favourites" element={<Placeholder title="Favourites" />} />
        <Route path="/groups" element={<Placeholder title="Groups" />} />
        <Route path="/profile" element={
          user ? (
            <Profile
              user={user}
              onLogout={handleLogout}
              onDeleteAccount={handleDeleteAccount}
            />
          ) : <Navigate to="/" />
        } />
        <Route path="/reviews" element={<Placeholder title="Reviews" />} />
        <Route path="*" element={
          <Placeholder title="404" message="That page doesn't exist." />
        } />
      </Routes>


      <Modal isOpen={authView !== null} onClose={closeAuth}>

        {authView === "login" && (
          <LoginForm
            notice={authNotice}
            onSubmit={handleLogin}
            onSwitchToRegister={() => {
              setAuthNotice(null);
              setAuthView("register");
            }}
          />
        )}

        {authView === "register" && (
          <RegisterForm
            onSubmit={handleRegister}
            onSwitchToLogin={() => setAuthView("login")}
          />
        )}

      </Modal>
    </div>
  );
}

export default App;