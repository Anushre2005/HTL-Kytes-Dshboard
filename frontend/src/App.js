import React, { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider, useData } from "./context/DataContext";
import Overview from "./pages/Overview";
import Projects from "./pages/Projects";
import CityPage from "./pages/CityPage";
import FeaturesPage from "./pages/FeaturesPage";
import UploadPage from "./pages/UploadPage";
import LoginPage from "./pages/LoginPage";

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { loading, error } = useData();

  if (loading) return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: "#F8F9FB"
    }}>
      <div style={{
        width: 48, height: 48, background: "#000000", borderRadius: 12,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
        </svg>
      </div>
      <div className="spinner" style={{ margin: "0 auto" }} />
      <p style={{ fontSize: 13, color: "#6b7280", marginTop: 12 }}>Loading dashboard data…</p>
    </div>
  );

  if (error) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#F8F9FB"
    }}>
      <div className="alert alert-error" style={{ maxWidth: 400, textAlign: "center" }}>
        {error}<br />
        <button className="btn btn-outline" style={{ marginTop: 12 }}
          onClick={() => window.location.reload()}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/city" element={<CityPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/upload" element={<ProtectedUpload />} />
        </Routes>
      </main>
    </div>
  );
}

function ProtectedUpload() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (!user) {
    if (showLogin) return <LoginPage onSuccess={() => setShowLogin(false)} />;
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{
          width: 56, height: 56, background: "#f3f4f6", borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px"
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
          Upload portal is restricted
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
          You need upload permissions to access this page.<br />
          Contact your administrator if you need access.
        </p>
        <button className="btn btn-primary" onClick={() => setShowLogin(true)}>
          Sign in to upload
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{
        background: "#ffffff", border: "1px solid #000000", borderRadius: 8,
        padding: "10px 16px", marginBottom: 16,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <span style={{ fontSize: 13, color: "#000000" }}>
          Signed in as <strong>{user.username}</strong>
        </span>
        <button onClick={logout} style={{
          fontSize: 12, color: "#6b7280", background: "none",
          border: "none", cursor: "pointer", textDecoration: "underline"
        }}>
          Sign out
        </button>
      </div>
      <UploadPage />
    </>
  );
}

function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <h2>Kytes Adoption Dashboard</h2>
        <p> Analytics</p>
      </div>
      <div className="sidebar-nav">
        {[
          { to: "/", label: "Overview", icon: <IGrid /> },
          { to: "/projects", label: "Projects", icon: <IList /> },
          { to: "/city", label: "City-wise", icon: <IMap /> },
          { to: "/features", label: "Features", icon: <IChart /> },
          { to: "/upload", label: "Upload", icon: <IUpload />, lock: true },
        ].map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === "/"} className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
            {n.icon}
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {n.label}
              {n.lock && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
            </span>
          </NavLink>
        ))}
      </div>
      <div className="sidebar-footer">Kytes Analytics v2.0</div>
    </nav>
  );
}

function IGrid() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>; }
function IList() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3" cy="6" r="1.5" /><circle cx="3" cy="12" r="1.5" /><circle cx="3" cy="18" r="1.5" /></svg>; }
function IMap() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>; }
function IChart() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>; }
function IUpload() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>; }
