import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../services/authApi.js";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem("sfpo_user");
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("sfpo_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.user);
          localStorage.setItem("sfpo_user", JSON.stringify(res.user));
        } catch {
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem("sfpo_token", res.token);
    localStorage.setItem("sfpo_user", JSON.stringify(res.user));
    toast.success(`Welcome back, ${res.user.name}!`);
    return res.user;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem("sfpo_token", res.token);
    localStorage.setItem("sfpo_user", JSON.stringify(res.user));
    toast.success("Account created successfully!");
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("sfpo_token");
    localStorage.removeItem("sfpo_user");
    toast.success("Logged out successfully");
  };

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager" || isAdmin;
  const isStaff = user?.role === "staff";

  const hasRole = (roles = []) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        isManager,
        isStaff,
        hasRole,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
