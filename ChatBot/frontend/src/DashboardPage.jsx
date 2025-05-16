import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardPage.css";

const API = "http://127.0.0.1:8000/dashboard";

export default function Dashboard() {
  const navigate = useNavigate();
  const [userCount, setUserCount] = useState(0);
  const [promptCount, setPromptCount] = useState(0);
  const [tokenUserCount, setTokenUserCount] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const [weeklyA, setWeeklyA] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const headers = { Authorization: `Token ${token}` };

    Promise.all([
      fetch(`${API}/user-count/`, { headers }).then(r => r.json()),
      fetch(`${API}/prompt-count/`, { headers }).then(r => r.json()),
      fetch(`${API}/token-user-count/`, { headers }).then(r => r.json()),
      fetch(`${API}/today-sessions/`, { headers }).then(r => r.json()),
      fetch(`${API}/weekly-sessions/`, { headers }).then(r => r.json()),
      fetch(`${API}/top-users/`, { headers }).then(r => r.json()),
    ]).then(([u, p, t, ts, ws, tu]) => {
      setUserCount(u.user_count);
      setPromptCount(p.total_prompts);
      setTokenUserCount(t.token_users);
      setTodaySessions(ts.today_sessions);
      if (Array.isArray(ws.weekly_sessions)) setWeeklyA(ws.weekly_sessions);
      setTopUsers(tu.top_users);
    });
  }, []);

  const maxWeekly = Math.max(...weeklyA, 1);
  const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  return (
    
    <div className="main-page">
        <div className="header">
        <div className="back-button-wrapper">
          <button className="back-btn" onClick={() => navigate("/app")}>
            <img src="/double-left.png" alt="Back" />
            <span>Geri Dön</span>
          </button>
        </div>
        </div>
        <div className="body">
        <div className="left-side">
        <div className="user-count">
          <div className="title">Kullanıcı Sayısı</div>
          <div className="value">{userCount}</div>
        </div>
        <div className="prompt-count">
          <div className="title">Prompt Sayısı</div>
          <div className="value">{promptCount}</div>
        </div>
        <div className="token-user-count">
          <div className="title">Token Kullanımı</div>
          <div className="value">{tokenUserCount}</div>
        </div>
      </div>
      <div className="right-side">
        <div className="weekly-sessions">
          <div className="title">Weekly Sessions</div>
          <div className="bar-chart">
            {weeklyA.map((v, i) => (
              <div className="bar-group" key={i}>
                <div className="bars">
                  <div
                    className="bar-inner bar1"
                    style={{ height: `${(v / maxWeekly) * 100}%` }}
                  />
                </div>
                <span className="bar-label">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="right-bot-side">
          <div className="todays-sessions">
            <div className="title">Today's Sessions</div>
            <div className="value">{todaySessions}</div>
          </div>
          <div className="top-users">
            <div className="title">Top Users</div>
            {topUsers.map((u, i) => (
              <div className="value" key={i}>
                {i + 1}. {u.email}
              </div>
            ))}
          </div>
        </div>
      </div>
        </div>
    </div>
  );
}
