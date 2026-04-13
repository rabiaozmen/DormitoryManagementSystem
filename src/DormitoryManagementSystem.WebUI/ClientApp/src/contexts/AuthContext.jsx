import { createContext, useContext, useState, useEffect } from "react";
import { login as loginApi, logout as logoutApi, refreshSession } from "../api/auth";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(() => localStorage.getItem("dms_role") || null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("dms_role"));

  useEffect(() => {
    if (role) {
      localStorage.setItem("dms_role", role);
    } else {
      localStorage.removeItem("dms_role");
    }
  }, [role]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      const persistedRole = localStorage.getItem("dms_role");

      if (!persistedRole) {
        if (isMounted) {
          setIsAuthenticated(false);
        }
        return;
      }

      try {
        const session = await refreshSession();
        if (!isMounted) return;

        setRole(session.role);
        setIsAuthenticated(true);
      } catch {
        if (!isMounted) return;

        setRole(null);
        setIsAuthenticated(false);
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials) => {
    const data = await loginApi(credentials);
    setRole(data.role);
    setIsAuthenticated(true);
    return data;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setRole(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ role, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
