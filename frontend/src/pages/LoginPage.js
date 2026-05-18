import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ onSuccess }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) { setError("Please enter both username and password."); return; }
    setLoading(true); setError(null);
    try {
      await login(username, password);
      onSuccess();
      navigate("/upload");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F8F9FB" }}>
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:16,
                    padding:"40px 36px", width:380, boxShadow:"0 4px 24px rgba(0,0,0,.06)" }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ width:44, height:44, background:"#000000", borderRadius:10,
                        display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 style={{ fontSize:20, fontWeight:600, color:"#111827" }}>Upload access</h2>
          <p style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>Sign in to access the upload portal</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:6 }}>Username</label>
          <input className="select-input" style={{ width:"100%", padding:"10px 12px" }}
                 value={username} onChange={e=>setUsername(e.target.value)}
                 onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="Enter username" autoFocus />
        </div>
        <div style={{ marginBottom:22 }}>
          <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:6 }}>Password</label>
          <input className="select-input" style={{ width:"100%", padding:"10px 12px" }}
                 type="password" value={password} onChange={e=>setPassword(e.target.value)}
                 onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="Enter password" />
        </div>

        <button className="btn btn-primary"
                style={{ width:"100%", justifyContent:"center", padding:11, fontSize:14 }}
                onClick={handleSubmit} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p style={{ fontSize:11, color:"#9ca3af", textAlign:"center", marginTop:16 }}>
          View-only access to the dashboard is open to everyone.<br />
          This login is only required to upload data.
        </p>
      </div>
    </div>
  );
}
