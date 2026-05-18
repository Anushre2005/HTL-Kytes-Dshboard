import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Clear token on every fresh page load (not on tab switch)
  useEffect(() => {
    // sessionStorage.setItem flag survives tab switches but 
    // NOT new page loads. We use a separate flag to detect refresh.
    const isRefresh = !sessionStorage.getItem("kytes_tab_active");
    if (isRefresh) {
      // Fresh page load — wipe everything
      sessionStorage.removeItem("kytes_token");
      delete axios.defaults.headers.common["Authorization"];
    }
    // Mark tab as active
    sessionStorage.setItem("kytes_tab_active", "true");

    // When tab/window closes, remove the active flag 
    // so next open is treated as fresh
    const handleUnload = () => {
      sessionStorage.removeItem("kytes_tab_active");
      sessionStorage.removeItem("kytes_token");
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("kytes_token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      axios.get("/api/auth/me")
        .then(r => setUser(r.data))
        .catch(() => {
          sessionStorage.removeItem("kytes_token");
          delete axios.defaults.headers.common["Authorization"];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);
    const res = await axios.post("/api/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const token = res.data.access_token;
    sessionStorage.setItem("kytes_token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    const me = await axios.get("/api/auth/me");
    setUser(me.data);
    return me.data;
  };

  const logout = () => {
    sessionStorage.removeItem("kytes_token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
