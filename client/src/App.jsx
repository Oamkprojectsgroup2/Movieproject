import { useState } from "react";
import { Routes, Route } from "react-router";
import Navbar from "./components/Navbar";
import Home from "./views/Home";
import Search from "./views/Search";
import Theaters from "./views/Theaters";
import Modal from "./components/Modal"
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import "./App.css";


function App() {

  

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
    console.log("Register", values);
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
        <Route path="*" element={<h2>Page not found</h2>} />
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