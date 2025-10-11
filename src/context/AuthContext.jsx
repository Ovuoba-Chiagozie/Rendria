import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { APP_BASE_URL } from "@/utils/env";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState(null); // 🔑 in-memory api key
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // ---- Helpers ----
  const getRedirectTarget = () => {
    const params = new URLSearchParams(location.search);
    return params.get("next") || "/templates";
  };

  const fetchApiKey = async () => {
    try {
      const res = await axios.get(`${APP_BASE_URL}/app/api-keys`, {
        withCredentials: true,
      });
      // Assuming backend returns latest active key { apiKey, keyId, createdAt }
      setApiKey(res.data[0].apiKey);
    } catch (err) {
      console.error("Failed to fetch API key:", err);
      setApiKey(null);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${APP_BASE_URL}/app/auth/me`, {
        withCredentials: true,
      });
      setUser(res.data.user);
      // also fetch apiKey
      await fetchApiKey();
    } catch (err) {
      setUser(null);
      setApiKey(null);
    } finally {
      setLoading(false);
    }
  };

  // ---- Run once on mount ----
  useEffect(() => {
    fetchUser();
  }, []);

  // ---- Auth Functions ----
  const signup = async (data) => {
    const res = await axios.post(
      `${APP_BASE_URL }/app/auth/signup`,
      data,
      { withCredentials: true }
    );

    setUser(res.data.user);
    setApiKey(res.data.apiKey); // use from response directly ✅

    navigate(getRedirectTarget());
    return res.data.user;
  };

  const login = async (data) => {
    const res = await axios.post(`${APP_BASE_URL}/app/auth/login`, data, {
      withCredentials: true,
    });
    setUser(res.data.user);

    // fetch apiKey immediately after login
    await fetchApiKey();

    navigate(getRedirectTarget());
    return res.data.user;
  };

  const logout = async () => {
    await axios.post(
      `${APP_BASE_URL}/app/auth/logout`,
      {},
      { withCredentials: true }
    );
    setUser(null);
    setApiKey(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        apiKey, // 🔑 available anywhere
        loading,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// easy hook
export const useAuth = () => useContext(AuthContext);
