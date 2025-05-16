import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ChatPage from "./ChatPage.jsx";   
import LoginPage from "./LoginPage.jsx";
import RegisterPage from "./RegisterPage.jsx";
import LandingPage from "./LandingPage.jsx";
import ForgotPasswordPage from "./ForgotPasswordPage.jsx";
import "./ChatPage.css";
import "./index.css";   
import App from "./ChatPage.jsx";
import Profile from "./ProfilePage.jsx";
import Edit from "./EditProfilePage.jsx";
import Dashboard from "./DashboardPage.jsx";
import { Link } from "react-router-dom";  

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/app" element={<App />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<Edit />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
