import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("silent_alarm_token") || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userProfile = await api.getMe(token);
          setUser(userProfile);
        } catch (err) {
          console.error("Token verification failed, clearing auth:", err);
          localStorage.removeItem("silent_alarm_token");
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (identifier, password) => {
    setError(null);
    try {
      const data = await api.login({ identifier, password });
      localStorage.setItem("silent_alarm_token", data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const data = await api.register(userData);
      localStorage.setItem("silent_alarm_token", data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateWellnessConsent = async (optedIn) => {
    if (!token) return;
    try {
      const updatedUser = await api.updateWellnessConsent(optedIn, token);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error("Failed to update wellness consent:", err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("silent_alarm_token");
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        login,
        register,
        updateWellnessConsent,
        logout,
        setError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
