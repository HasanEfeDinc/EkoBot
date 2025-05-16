// ForgotPasswordPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function getCookie(name) {
    const match = document.cookie.match(
      new RegExp("(^|;\\s*)" + name + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[2]) : null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const URL = "http://localhost:8000/password-reset/";

      await fetch(URL, { credentials: "include", mode: "cors" });
      const csrf = getCookie("csrftoken");
      if (!csrf) throw new Error("CSRF token alınamadı.");

      const body = new URLSearchParams({
        email,
        csrfmiddlewaretoken: csrf,
      });

      const res = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRFToken": csrf,
        },
        credentials: "include",
        body,
      });

      if (!res.ok) throw new Error("Bir hata oluştu.");

      setSent(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="fp-container">
      <div className="fp-card">
        <h2 className="fp-title">Şifreni mi unuttun?</h2>

        {sent ? (
          <p className="fp-success">
            Eğer bu e-posta adresi kayıtlıysa, sıfırlama bağlantısı
            gönderdik. Gelen kutunu ve spam klasörünü kontrol et!
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="fp-form">
            <p className="fp-info">
              Şifre sıfırlama bağlantısını göndereceğimiz e-posta adresini gir.
            </p>

            <label className="fp-label" htmlFor="email">
              E-posta adresi
            </label>
            <input
              id="email"
              type="email"
              className="fp-input"
              placeholder="ornek@site.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" className="fp-button">
              Sıfırlama linki gönder
            </button>
          </form>
        )}

        {error && <p className="fp-error">{error}</p>}

        <div className="fp-links">
          <Link to="/login">Girişe dön</Link>
          <span>·</span>
          <Link to="/register">Kayıt ol</Link>
        </div>
      </div>
    </div>
  );
}
