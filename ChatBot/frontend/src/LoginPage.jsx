import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";

const STORAGE_KEY = "selectedSessionId";

export default function LoginPage() {
  const [email, setEmail]   = useState("");
  const [password, setPass] = useState("");
  const [show, setShow]     = useState(false);
  const [error, setError]   = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.non_field_errors?.[0] || "Giriş başarısız.");
      }

      const { token } = await response.json();
      localStorage.setItem("authToken", token);
      localStorage.setItem("forceFreshSession", "1");
      localStorage.removeItem(STORAGE_KEY);
      navigate("/app");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">EkoBot + </h2>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">E-posta</label>
          <input
            type="email"
            className="login-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label className="login-label">Şifre</label>
          <div className="password-wrapper">
            <input
              type={show ? "text" : "password"}
              className="login-input"
              value={password}
              onChange={e => setPass(e.target.value)}
              required
            />
            <span
              className="material-symbols-outlined toggle-password"
              onClick={() => setShow(p => !p)}
            >
              {show ? "visibility_off" : "visibility"}
            </span>
          </div>
          <Link to="/forgotpassword" className="forgot-password-link">
            Şifreni mi unuttun?
          </Link>

          <button type="submit" className="login-button">
            Giriş Yap
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}

        <p className="login-help">
          <div>
            Hesabın yok mu?{" "}
            <Link to="/register" className="login-register-link">
              Kayıt ol
            </Link>
          </div>

        </p>
      </div>
    </div>
  );
}
