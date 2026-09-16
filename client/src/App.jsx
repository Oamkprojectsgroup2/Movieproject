import { useState } from "react";

import Navbar from "./components/Navbar";
import Home from "./views/Home";
import Search from "./views/Search";
import Theaters from "./views/Theaters";
import Modal from "./components/Modal"
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import "./App.css";
import { BASE_URL } from "./config";


function App() {

  const [currentPage, setCurrentPage] = useState("home");

  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [language, setLanguage] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [siteLanguage, setSiteLanguage] = useState("en-US");
  const [authView, setAuthView] = useState(null);
  const [authNotice, setAuthNotice] = useState(null);

  const closeAuth = () => {
    setAuthView(null);
    setAuthNotice(null);
  };

  const handleLogin = async (values) => {
    // TODO (#17): send values to the login API
    console.log("Login", values);
    closeAuth();
  };
  
  const handleRegister = async (values) => {
    // TODO (#13): send values to the registration API
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values),
    });

    const data = await response.json();

    console.log("HTTP Status:", response.status);
    console.log("Server Response Data:", data);

    if (!response.ok) {
      throw new Error(data.message || "Resgistration failed");
    }

    console.log("Register", values);
    setAuthNotice("Account created. You can now log in.");
    setAuthView("login");
  };

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
        onLoginClick={() => setAuthView("login")}
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

      {currentPage === "theaters" && (
        <Theaters />
      )}

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