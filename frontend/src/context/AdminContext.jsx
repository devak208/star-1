"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AdminContext = createContext()

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAdminAuth();
  }, [])

  const checkAdminAuth = () => {
    setIsLoading(true);
    try {
      const adminData = localStorage.getItem("adminData")
      if (adminData) {
        const userData = JSON.parse(adminData)
        if (userData.role === "ADMIN") {
          setAdmin(userData)
          setIsAuthenticated(true)
        }
      }
    } catch (error) {
      console.error("Error checking admin auth:", error);
      logout();
    } finally {
      setIsLoading(false)
    }
  }

  const login = (adminData) => {
    if (!adminData || adminData.role !== "ADMIN") {
      console.error("Invalid admin data or not an admin user");
      return;
    }
    
    localStorage.setItem("adminData", JSON.stringify(adminData))
    setAdmin(adminData)
    setIsAuthenticated(true)
    console.log("Admin login successful");
  }

  const logout = () => {
    localStorage.removeItem("adminData")
    setAdmin(null)
    setIsAuthenticated(false)
    console.log("Admin logout successful");
  }

  const value = {
    admin,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAdminAuth
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}

