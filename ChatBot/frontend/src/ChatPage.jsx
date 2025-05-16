// ChatPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ChatPage.css";

const API_BASE      = "http://127.0.0.1:8000/api";
const TITLE_LIMIT   = 24;
const STORAGE_KEY   = "selectedSessionId";
const DEFAULT_AVATAR = "/profile.png";

export default function App() {
  

  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [sessions, setSessions]   = useState([]);
  const [messages, setMessages]   = useState([]);
  const [userPrompt, setUserPrompt] = useState("");
  const [isLoading, setIsLoading]   = useState(false);

  const [showFileMenu, setShowFileMenu] = useState(false);
  const [excelFile, setExcelFile]       = useState(null);

  const bottomRef      = useRef(null);
  const inputRef       = useRef(null);
  const editRef        = useRef(null);
  const fileMenuRef    = useRef(null);
  const fileInputRef   = useRef(null);
  const didInit        = useRef(false);

  const [editingIndex, setEditingIndex]   = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editingTitleText, setEditingTitleText] = useState("");

  const [profilePic, setProfilePic] = useState(DEFAULT_AVATAR);

  const SERVER_ROOT = API_BASE.replace(/\/api\/?$/, "");   // → http://127.0.0.1:8000
const toAbsolute  = (url) => {
  if (!url) return null;
  return /^https?:\/\//.test(url)
    ? url
    : `${SERVER_ROOT}${url.startsWith("/") ? "" : "/"}${url}`;
};

  useEffect(() => {
    async function init() {
      if (process.env.NODE_ENV === "development" && didInit.current) return;
      didInit.current = true;

      const token = localStorage.getItem("authToken");
      if (!token) return;

      // get user profile picture
      try {
        const resUser = await fetch(`${API_BASE}/user/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const dataUser = await resUser.json();
        const userObj  = Array.isArray(dataUser) ? dataUser[0] : dataUser;
        if (userObj?.profile_picture) setProfilePic(userObj.profile_picture);
      } catch { /* ignore */ }

      const fresh = await fetchSessions(token);
      setSessions(fresh);

      const forceFresh = localStorage.getItem("forceFreshSession");
      const savedRaw   = localStorage.getItem(STORAGE_KEY);
      const saved      = savedRaw ? Number(savedRaw) : null;

      if (forceFresh) {
        localStorage.removeItem("forceFreshSession");
        if (fresh.length > 0) {
          const last = fresh[0];
          const ok   = await sessionIsEmpty(last.id, token);
          if (ok) {
            setSelectedId(last.id); setSessionId(last.id);
            localStorage.setItem(STORAGE_KEY, String(last.id));
            await fetchMessages(last.id);
            return;
          }
        }
        const newId = await createNewSession();
        await fetchMessages(newId);
        return;
      }

      if (saved && fresh.find(s => s.id === saved)) {
        setSelectedId(saved); setSessionId(saved); await fetchMessages(saved);
      } else if (fresh.length > 0) {
        const first = fresh[0].id;
        setSelectedId(first); setSessionId(first);
        await fetchMessages(first);
        localStorage.setItem(STORAGE_KEY, String(first));
      } else {
        const newId = await createNewSession();
        await fetchMessages(newId);
      }
    }
    init();
  }, []);
  /* ------------------------------------------------------ */

  useEffect(() => { if (selectedId) { setMessages([]); fetchMessages(selectedId); } }, [selectedId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!isLoading) inputRef.current?.focus(); }, [messages, isLoading]);
  useEffect(() => {
    if (editingIndex !== null && editRef.current) {
      const len = editRef.current.value.length;
      editRef.current.focus();
      editRef.current.setSelectionRange(len, len);
    }
  }, [editingIndex]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target)) setShowFileMenu(false);
    }
    if (showFileMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFileMenu]);

  /* ---- helpers ---- */
  async function fetchSessions(token) {
    const res = await fetch(`${API_BASE}/chat/sessions/`, {
      headers: { Authorization: `Token ${token}` },
    });
    const data = await res.json();
    return data.map(s => ({ ...s, title: s.title || "Yeni Oturum", icon: "/message.png" }));
  }

  async function sessionIsEmpty(id, token) {
    const res = await fetch(`${API_BASE}/chat/session/${id}/messages/`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!res.ok) return false;
    const msgs = await res.json();
    return msgs.length === 0;
  }

  async function createNewSession() {
    const token = localStorage.getItem("authToken");
    const res   = await fetch(`${API_BASE}/chat/session/create/`, {
      method : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      body   : JSON.stringify({}),
    });
    const data  = await res.json();
    const newId = data.session_id;
    const title = data.title?.trim() || "Yeni Oturum";
    setSessionId(newId); setSelectedId(newId); localStorage.setItem(STORAGE_KEY, String(newId));
    setSessions(prev => [{ id: newId, title, icon: "/message.png" }, ...prev]);
    setMessages([]);
    return newId;
  }

  function handleSelect(id) {
    if (id === selectedId) return;
    setSelectedId(id); setSessionId(id); setMessages([]);
    localStorage.setItem(STORAGE_KEY, String(id));
  }

  async function ensureSession() {
    if (sessionId) return sessionId;
  
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API_BASE}/chat/session/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
  
    const title = data.title?.trim() || "Yeni Oturum";
  
    setSessionId(data.session_id);
    setSelectedId(data.session_id);
    localStorage.setItem(STORAGE_KEY, data.session_id);
    setSessions(prev => [
      { id: data.session_id, title, icon: "/message.png" },
      ...prev,
    ]);
  
    return data.session_id;
  }
  

  async function createNewSession() {
    const token = localStorage.getItem("authToken");
  
    const fresh = await fetchSessions(token);
    if (fresh.length > 0) {
      const lastSess = fresh[0];
      const resMsgs = await fetch(`${API_BASE}/chat/session/${lastSess.id}/messages/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (resMsgs.ok) {
        const msgs = await resMsgs.json();
        if (msgs.length === 0) {
          setSessionId(lastSess.id);
          setSelectedId(lastSess.id);
          localStorage.setItem(STORAGE_KEY, String(lastSess.id));
          setMessages([]);  
          return lastSess.id;
        }
      }
    }
  
    const res = await fetch(`${API_BASE}/chat/session/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    const newId = data.session_id;
    const title = data.title?.trim() || "Yeni Oturum";
  
    setSessionId(newId);
    setSelectedId(newId);
    localStorage.setItem(STORAGE_KEY, String(newId));
    setMessages([]);
    setSessions(prev => [
      { id: newId, title, icon: "/message.png" },
      ...prev,
    ]);
  
    return newId;
  }

  async function handleDeleteSession(id, e) {
    e.stopPropagation();             
    const token = localStorage.getItem("authToken");

    await fetch(`${API_BASE}/chat/session/${id}/delete/`, {
      method: "DELETE",
      headers: { Authorization: `Token ${token}` },
    });

    const fresh = await fetchSessions(token);
    setSessions(fresh);

    if (id === selectedId) {
      setMessages([]);               
      localStorage.removeItem(STORAGE_KEY);
      await createNewSession();       
    }
  }

  


  async function clearAllSessions() {
    const token = localStorage.getItem("authToken");
    for (const sess of sessions) {
      if (sess.id !== sessionId) {
        await fetch(`${API_BASE}/chat/session/${sess.id}/delete/`, {
          method: "DELETE",
          headers: { Authorization: `Token ${token}` },
        });
      }
    }
    const updated = await fetchSessions(token);
    setSessions(updated);
  }

  async function fetchSessions(token) {
    const res = await fetch(`${API_BASE}/chat/sessions/`, {
      headers: { Authorization: `Token ${token}` },
    });
    const data = await res.json();
    return data.map(s => ({
      ...s,
      title: s.title || "Yeni Oturum",
      icon: "/message.png",
    }));
  }


async function handleSendPrompt(e) {
  e.preventDefault();
  if (!userPrompt.trim() || isLoading) return;

  setIsLoading(true);
  const id = await ensureSession();

  const userMessage = {
    role      : "user",
    content   : userPrompt,
    attachment: excelFile
               ? { name: excelFile.name, type: excelFile.type }
               : null,
  };
  const form        = new FormData();
  form.append("message", userMessage.content);
  if (excelFile) form.append("file", excelFile);  

  setExcelFile(null);                
  if (fileInputRef.current) {
    fileInputRef.current.value = "";  
  }

  
  setMessages(prev => [
    ...prev,
    userMessage,
    { role: "ai", content: "...düşünüyor..." },
  ]);
  setUserPrompt("");

  try {
    const token = localStorage.getItem("authToken");

    const res = await fetch(`${API_BASE}/chat/send/${id}/`, {
      method: "POST",
      headers: { Authorization: `Token ${token}` },  
      body: form,
    });

    const data = await res.json();
    const modelAnswer = data.bot_reply.message || "No answer found";
    const chartUrl   = data.bot_reply.chart_image;   

    setMessages(prev => {
      const u = [...prev];
      u[u.length - 1] = {
        role: "ai",
        content: modelAnswer,
        chart: chartUrl,              
      };
      return u;
    });

    const updatedSessions = await fetchSessions(token);
    setSessions(updatedSessions);
  } catch (err) {
    setMessages(prev => {
      const u = [...prev];
      u[u.length - 1] = { role: "ai", content: "Error connecting to model" };
      return u;
    });
  }
  finally {
    setExcelFile(null);              
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
    setShowFileMenu(false);          // menüyü kapat
    setIsLoading(false);
  }

  setExcelFile(null);         
  setIsLoading(false);
}


  async function fetchMessages(sessId) {
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API_BASE}/chat/session/${sessId}/messages/`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    const formatted = data.map(msg => ({
      role: msg.is_user ? "user" : "ai",
      content: msg.message,
      chart  : toAbsolute(msg.chart_image),
    }));
    setMessages(formatted);
  }

  function handleUpdateQuestion(e) {
    e.preventDefault();
  
    const oldChart = messages[editingIndex + 1]?.chart ?? null;
  
    setMessages(prev => {
      const u = [...prev];
      u[editingIndex] = { ...u[editingIndex], content: editingContent };
      if (u[editingIndex + 1]?.role === "ai") u.splice(editingIndex + 1, 1);
      u.push({ role: "ai", content: "...thinking...", chart: oldChart });
      return u;
    });
  
    refetchAnswer(editingContent, oldChart);
  
    setEditingIndex(null);
    setEditingContent("");
  }
  

  async function handleSaveTitle(e) {
    e.preventDefault();                       
    const token = localStorage.getItem("authToken");
    const id = editingTitleId;
    try {
      await fetch(`${API_BASE}/chat/session/${id}/update-title/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ title: editingTitleText }),
      });
      setSessions(prev =>
        prev.map(s => (s.id === id ? { ...s, title: editingTitleText } : s))
      );
    } finally {
      setEditingTitleId(null);
      setEditingTitleText("");
    }
  }

  async function refetchAnswer(q, oldChart = null) {
    setIsLoading(true);
  
    try {
      const id    = await ensureSession();
      const token = localStorage.getItem("authToken");
  
      const res = await fetch(`${API_BASE}/chat/send/${id}/`, {
        method : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization : `Token ${token}`,
        },
        body: JSON.stringify({ message: q }),
      });
  
      const data     = await res.json();
      const newText  = data.bot_reply.message || "No answer found";
      const newChart = data.bot_reply.chart_image;     
  
      setMessages(prev => {
        const u = [...prev];
        u[u.length - 1] = {
          ...u[u.length - 1],
          content: newText,
          chart  : newChart ?? oldChart,
        };
        return u;
      });
  
    } catch {
      setMessages(prev => {
        const u = [...prev];
        u[u.length - 1] = { ...u[u.length - 1], content: "Error connecting to model" };
        return u;
      });
    }
  
    setIsLoading(false);
  }
  
  

  function handleRegenerate(question, index) {
    setEditingIndex(null);
    setIsLoading(true);
    setMessages(prev => {
      const u = [...prev];
      if (u[index + 1]?.role === "ai") {
        u[index + 1] = { ...u[index + 1], content: "...thinking..." };
      }
      return u;
    });
    fetchRegenerate(question, index);
  }

  async function fetchRegenerate(question, index) {
    try {
      const id    = await ensureSession();
      const token = localStorage.getItem("authToken");
  
      const res   = await fetch(`${API_BASE}/chat/send/${id}/`, {
        method : "POST",
        headers: { "Content-Type": "application/json",
                   Authorization: `Token ${token}` },
        body   : JSON.stringify({ message: question }),
      });
  
      const data      = await res.json();
      const ans       = data.bot_reply.message || "No answer found";
      const chartUrl  = data.bot_reply.chart_image;           
  
      setMessages(prev => {
        const u = [...prev];
        if (u[index + 1]?.role === "ai") {
          u[index + 1] = {
            ...u[index + 1],           
            content: ans,
            chart  : chartUrl ?? u[index + 1].chart, 
          };
        }
        return u;
      });
  
    } catch {
      setMessages(prev => {
        const u = [...prev];
        if (u[index + 1]?.role === "ai") {
          u[index + 1] = { ...u[index + 1], content: "Error connecting to model" };
        }
        return u;
      });
    }
    setIsLoading(false);
  }
  

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!isLoading) inputRef.current?.focus(); }, [messages, isLoading]);
  useEffect(() => {
    if (editingIndex !== null && editRef.current) {
      const len = editRef.current.value.length;
      editRef.current.focus();
      editRef.current.setSelectionRange(len, len);
    }
  }, [editingIndex, editingContent]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        fileMenuRef.current &&
        !fileMenuRef.current.contains(event.target)
      ) {
        setShowFileMenu(false);
      }
    }
  
    if (showFileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFileMenu]);

  function handleChooseFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
  if (!file) return;

    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!allowed.includes(file.type)) {
      alert("Lütfen Excel (.xlsx / .xls) dosyası seçin!");
      return;
    }

    setExcelFile(file);
    setShowFileMenu(false);
    e.target.value = "";
  }
  

  return (
    <div className="app-container">
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".xlsx,.xls"
        onChange={handleFileChange}
      />

      {/* ---------- SIDEBAR ---------- */}
      <div className="sidebar-container">
        <div className="sidebar">
          <div className="sidebar-header"><h2>CHAT A.I +</h2></div>

          <button className="new-chat-btn" onClick={createNewSession}>+ Yeni Sohbet</button>

          <div className="conversations-header">
            <p>Sohbet Geçmişi</p>
            <button type="button" className="clear-all" onClick={clearAllSessions}>
              Tümünü Sil
            </button>
          </div>

          <div className="conversation-list">
            {sessions.map(c => {
              const isSel = c.id === selectedId;
              return (
                <div key={c.id} className={`conversation-item${isSel ? " selected" : ""}`} onClick={() => handleSelect(c.id)}>
                  <div className="conversation-left">
                    <img src={c.icon} alt="Msg" className="conversation-icon" />
                    {editingTitleId === c.id ? (
                      <form onSubmit={handleSaveTitle} style={{ width: "100%" }}>
                        <input
                          className="edit-title-input"
                          value={editingTitleText}
                          autoFocus
                          maxLength={30}
                          onChange={e => setEditingTitleText(e.target.value)}
                          onKeyDown={e => { if (e.key === "Escape") setEditingTitleId(null); }}
                        />
                      </form>
                    ) : (
                      <span className="conversation-text">{c.title}</span>
                    )}
                  </div>
                  <div className="conversation-actions">
                    <div className={`icon-wrapper ${isSel ? "selected-icon-wrapper" : ""}`}>
                      <button onClick={(e) => handleDeleteSession(c.id, e)}><img src="/delete.png" alt="Del" /></button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingTitleId(c.id); setEditingTitleText(c.title); }}>
                        <img src="/edit.png" alt="Edit" />
                      </button>
                      {isSel && (<><div/><div/><div/></>)}
                    </div>
                  </div>
                  {isSel && <div className="attach-btn"><img src="/attach.png" alt="Attach" /></div>}
                </div>
              );
            })}
          </div>

          <div className="sidebar-footer">
            <button className="footer-btn-custom" onClick={() => navigate("/profile")}>
              <img src={profilePic} alt="Profile" className="profile-image" />
              <span>Profil Sayfası</span>
            </button>
            <button className="footer-btn-custom" onClick={() => navigate("/dashboard")}>
              <img src="/dashboard.png" alt="Dashboard" className="profile-image" />
              <span>Gösterge Paneli</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------- MAIN CHAT ---------- */}
      <main className="main-content">
        <div className="main-header-space"></div>

        <section className="chat-window">
          {messages.map((msg, idx) => {
            if (msg.role !== "user") return null;
            const nextMsg  = messages[idx + 1];
            const hasAI    = nextMsg && nextMsg.role === "ai";
            return (
              <div className="chat-dialog" key={idx}>
                <div className="chat-question">
                  <div className="chat-profile-wrapper">
                    <img src={profilePic} alt="User" className="chat-profile-img" />
                  </div>

                  <div className="chat-bubble-user-question">
                    {editingIndex === idx ? (
                      <form onSubmit={handleUpdateQuestion}>
                        <textarea
                          ref={editRef}
                          className="edit-textarea"
                          value={editingContent}
                          onChange={e => {
                            setEditingContent(e.target.value);
                            e.target.style.height   = "auto";
                            e.target.style.height   = e.target.scrollHeight + "px";
                          }}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleUpdateQuestion(e); } }}
                          rows="1"
                        />
                      </form>
                    ) : <p>{msg.content}</p>}
                  </div>

                  <div className="question-edit-btn">
                    <button onClick={() => { setEditingIndex(idx); setEditingContent(msg.content); }}>
                      <img src="/edit.png" alt="Edit" />
                    </button>
                  </div>
                </div>

                {msg.attachment && (
                  <div className="chat-file-chip">
                    <img src="/document.png" alt="File" />
                    <span>{msg.attachment.name}</span>
                  </div>
                )}

                {hasAI && (
                  <>
                    <div className="chat-answer">
                      <div className="chat-bubble-ai-answer">
                        <div className="chat-AI-Model">EkoBot +</div>
                        <p>{nextMsg.content}</p>
                        {nextMsg.chart && (
                          <div className="chart-image-wrapper">
                            <img src={nextMsg.chart} alt="Chart" className="chart-image" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="dialog-bottom">
                      <div className="regenerate-btn">
                        <div className="regenerate-btn-wrapper">
                          <button onClick={() => handleRegenerate(messages[idx].content, idx)}>
                            <img src="/regenerate.png" alt="Regenerate" />
                            <span>Yeniden Gönder</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          <div ref={bottomRef}></div>
        </section>

        <section className="prompt-container">
        <div className={`prompt-wrapper${excelFile ? " file-attached" : ""}`}>
      {excelFile && (
          <div className="file-chip">
            <span>{excelFile.name}</span>
            <button
              type="button"
              onClick={() => setExcelFile(null)}
              title="Kaldır"
            >
              ✕
            </button>
          </div>
        )}
        <form className="prompt-form" onSubmit={handleSendPrompt}>
          <div className="prompt-actions">
          <div className="chat-button-wrapper relative">
              <button
                type="button"
                onClick={() => setShowFileMenu((p) => !p)}
              >
                <img src="/sendfile.png" alt="Send file" />
              </button>

              {showFileMenu && (
                <div className="file-menu" ref={fileMenuRef}>
                        <button type="button" onClick={handleChooseFile}>
                    <img src="/addfile.png" alt="Dosya Ekle" />
                    <p>Dosya Yükle</p>
                  </button>
                </div>
              )}
            </div>
          </div>

          <input
            ref={inputRef}
            type="text"
            autoFocus
            placeholder="Bir şey sor..."
            className="prompt-input"
            required
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            disabled={isLoading}
          />

          <div className="prompt-actions">
            {userPrompt.trim() !== "" && (
              <div className="chat-button-wrapper">
                <button type="submit" disabled={isLoading}>
                  <img src="/send.png" alt="Send" />
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
      </main>
    </div>
  );
}
