// RegisterPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./RegisterPage.css";

export default function RegisterPage() {
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [passwordAgain, setPwd2]    = useState("");
  const [showPwd1, setShowPwd1]     = useState(false);
  const [showPwd2, setShowPwd2]     = useState(false);
  const [error, setError]           = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== passwordAgain) {
      setError("Şifreler uyuşmuyor!");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/user/", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data?.email?.[0] || data?.password?.[0] || "Kayıt başarısız."
        );
      }
      navigate("/login");
    } catch (err) {
      setError("Hata: " + err.message);
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="avatar-wrapper">
          <img src="/EkotenLogo2.png" alt="Profil" className="avatar-img" />
        </div>

        <h2 className="register-title">EkoBot&nbsp;+</h2>

        <form onSubmit={handleSubmit} className="register-form">
          <label className="register-label">İsim</label>
          <input
            className="register-input"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <label className="register-label">E-posta</label>
          <input
            type="email"
            className="register-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label className="register-label">Şifre</label>
          <div className="password-wrapper">
            <input
              type={showPwd1 ? "text" : "password"}
              className="register-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <span
              className="material-symbols-outlined toggle-password"
              onClick={() => setShowPwd1(p => !p)}
            >
              {showPwd1 ? "visibility_off" : "visibility"}
            </span>
          </div>

          <label className="register-label">Şifre (Tekrar)</label>
          <div className="password-wrapper">
            <input
              type={showPwd2 ? "text" : "password"}
              className="register-input"
              value={passwordAgain}
              onChange={e => setPwd2(e.target.value)}
              required
            />
            <span
              className="material-symbols-outlined toggle-password"
              onClick={() => setShowPwd2(p => !p)}
            >
              {showPwd2 ? "visibility_off" : "visibility"}
            </span>
          </div>

          <button type="submit" className="register-button">
            Kayıt Ol
          </button>
        </form>

        <div className="register-links">
          <span>Hesabın var mı? </span>
          <Link to="/login" className="register-link">
            Girişe dön
          </Link>
        </div>

        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
