// EditProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./EditProfilePage.css";

export default function ProfilePage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changePwd, setChangePwd] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewSrc, setPreviewSrc] = useState("/profile.png");
  const [saved, setSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    fetch("http://127.0.0.1:8000/api/user/", {
      headers: { Authorization: `Token ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        const u = Array.isArray(d) ? d[0] : d;
        setName(u.name || "");
        setDisplayName(u.name || "");
        setEmail(u.email || "");
        setUserId(u.id);
        if (u.profile_picture) setPreviewSrc(u.profile_picture);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setSelectedImage(f);
    setPreviewSrc(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!token || !userId) return;

    await fetch(`http://127.0.0.1:8000/api/user/${userId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ name, email }),
    }).then(() => {
      setSaved(true);
      setDisplayName(name);
      setTimeout(() => setSaved(false), 2000);
    });

    if (changePwd && oldPassword && newPassword) {
      const resPwd = await fetch("http://127.0.0.1:8000/api/change-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
      if (resPwd.ok) {
        setPasswordSaved(true);
        setOldPassword("");
        setNewPassword("");
        setChangePwd(false);
        setTimeout(() => setPasswordSaved(false), 2000);
      } else {
        const err = await resPwd.json();
        alert(
          err.old_password ||
            err.new_password ||
            err.error ||
            "Şifre güncelleme başarısız!"
        );
      }
    }

    if (selectedImage) {
      const fd = new FormData();
      fd.append("profile_picture", selectedImage);
      await fetch("http://127.0.0.1:8000/api/upload-profile-picture/", {
        method: "PATCH",
        headers: { Authorization: `Token ${token}` },
        body: fd,
      });
      setSelectedImage(null);
    }
  };

  if (loading)
    return (
      <div className="profile-container">
        <div className="profile-card">Yükleniyor...</div>
      </div>
    );

  return (
    <div className="page-wrapper">
      {/* ---------- HEADER ---------- */}
      <div className="header">
        <div className="back-button-wrapper">
          <button className="back-btn" onClick={() => navigate("/profile")}>
            <img src="/double-left.png" alt="Back" />
            <span>Geri Dön</span>
          </button>
        </div>
      </div>

      {/* ---------- BODY ---------- */}
      <div className="profile-container">
        <div className="edit-profile-card">
          <div className="avatar-section">
            <img src={previewSrc} alt="Profil" className="profile-avatar" />
            <label className="camera-btn">
              <input
                type="file"
                accept="image/*"
                className="camera-input"
                onChange={handleFileChange}
              />
              <img src="/camera.png" alt="Kamera" className="camera-icon-btn" />
            </label>
          </div>

          <h3 className="profile-name">{displayName}</h3>
          <form className="profile-form" onSubmit={handleSubmit}>
            <label>
              İsim
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              E-posta
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="pwd-label">
              Eski Şifre
              <div className="pwd-wrapper">
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Mevcut şifreniz"
                  disabled={!changePwd}
                />
                <button
                  type="button"
                  className={`pwd-toggle ${changePwd ? "cancel" : ""}`}
                  onClick={() => {
                    if (changePwd) {        
                      setOldPassword("");   
                      setNewPassword("");
                    }
                    setChangePwd(p => !p);    
                  }}
                >
                  {changePwd ? "İptal" : "Değiştir"}
                </button>
              </div>
            </label>

            <label className={!changePwd ? "disabled" : ""}>
              Yeni Şifre
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yeni şifre"
                disabled={!changePwd}
              />
            </label>

            <button type="submit" className="save-btn">
              Kaydet
            </button>
            {saved && <div className="saved-msg">Profil güncellendi!</div>}
            {passwordSaved && (
              <div className="saved-msg">Şifre değiştirildi!</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
