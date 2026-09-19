import { createContext, useContext, useEffect, useState } from "react";
import {
  loginRequest,
  registerRequest,
  fetchProfileRequest,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetchProfileRequest();
        setUser(response.data.user);
        setToken(storedToken);
      } catch (error) {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const response = await loginRequest(email, password);
    const { token: newToken, user: loggedInUser } = response.data;

    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(loggedInUser);

    return loggedInUser;
  };

  const register = async (name, email, password) => {
    // The backend does not issue a token on registration, so there is
    // nothing to store here. The caller is responsible for sending the
    // user to the login page afterward.
    const response = await registerRequest(name, email, password);
    return response.data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}