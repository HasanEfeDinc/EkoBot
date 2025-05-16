// ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    fetch("http://127.0.0.1:8000/api/user/", {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const u = Array.isArray(data) ? data[0] : data;
        setUser({
          avatar: u.profile_picture || "/profile.png",
          name: u.name || "-",
          email: u.email || "-",
          company: u.company || "EkoBot +",
          website: u.website || "EkoBot +",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  if (loading || !user) {
    return (
      <div className="profilepage-container">
        <div className="profile-card">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="profilepage-container">
      <div className="profile-card">
        <div className="profile-header-bg" />
        <div className="profile-avatar-bg">
          <img src={user.avatar} alt="Avatar" className="profile-avatar-img" />
        </div>

        <div className="profile-main-info">
          <h2 className="profile-name">
            {user.name} <span className="profile-verified">✔️</span>
          </h2>
          <div className="profile-email">{user.email}</div>

          <button
            className="profile-edit-btn"
            style={{ position: "static", marginTop: "0.7rem" }}
            onClick={() => navigate("/profile/edit")}
          >
            Düzenle
          </button>
        </div>

        <div className="profile-details">
          <div>
            <span className="profile-value ekobot">{user.website}</span>
          </div>
        </div>
        <div className="profile-logout-btn" onClick={handleLogout}>
        <img src="/logout.png" alt="Çıkış Yap" className="profile-logout-icon" />
        <span className="profile-logout-text">Çıkış Yap</span>
      </div>
      </div>

      <div className="profile-back-btn" onClick={() => navigate("/app")}>
        <img
          src="/double-left.png"
          alt="Geri Dön"
          className="profile-back-icon"
        />
        <span className="profile-back-text">Geri Dön</span>
      </div>


    </div>
  );
}
