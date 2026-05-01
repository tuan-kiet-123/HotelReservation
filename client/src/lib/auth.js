import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchUsers } from "./api";

const STORAGE_KEY = "mock_current_user";

const fallbackUsers = [
  { UserId: "USR2000001", FullName: "Nguyễn Văn A", Email: "a@example.com" },
  { UserId: "USR2000002", FullName: "Trần Thị B", Email: "b@example.com" },
  { UserId: "USR2000012", FullName: "Lê Văn C", Email: "c@example.com" }
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(fallbackUsers);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        const data = await fetchUsers(3);
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data
            .map((u) => ({
              UserId: String(u._id || u.UserId || ""),
              FullName: u.FullName || "",
              Email: u.Email || ""
            }))
            .filter((u) => u.UserId && u.FullName);

          if (mapped.length > 0) {
            setUsers(mapped);
          }
        }
      } catch (e) {
        // ignore, keep fallback users
      }
    }

    loadUsers();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      if (currentUser) localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }, [currentUser]);

  function listDemoUsers() {
    return users;
  }

  function switchUser(userId) {
    const u = users.find((x) => x.UserId === userId) || null;
    setCurrentUser(u);
    return u;
  }

  function logout() {
    setCurrentUser(null);
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { currentUser, listDemoUsers, switchUser, logout } },
    children
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
