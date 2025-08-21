"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import api from "./axios"
import { handleApiError } from "./api-utils"
import { useRouter } from "next/navigation"
import axios from "axios"

interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  position: "admin" | "employee"
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
  checkAuth: () => Promise<void>
  accessToken: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Set up axios interceptors when access token changes
  useEffect(() => {
    // Request interceptor to attach access token
    const requestInterceptor = api.interceptors.request.use((config) => {
      // Don't add token to refresh endpoint
      if (accessToken && !config.url?.includes('/api/auth/refresh')) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
      return config
    })

    // Response interceptor to handle token refresh
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        // If we get a 401 and haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry && accessToken && !originalRequest.url?.includes('/api/auth/refresh')) {
          originalRequest._retry = true

          try {
            // Try to refresh the token using the HTTP-only cookie
            const refreshResponse = await api.post("/api/auth/refresh")
            
            if (refreshResponse.data?.accessToken) {
              // Update access token in state
              setAccessToken(refreshResponse.data.accessToken)
              
              // Retry the original request with the new token
              originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`
              return api(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            console.log("Token refresh failed, logging out")
            setUser(null)
            setAccessToken(null)
            
            if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
              window.location.href = "/login"
            }
          }
        }

        return Promise.reject(error)
      }
    )

    // Cleanup function to remove interceptors
    return () => {
      api.interceptors.request.eject(requestInterceptor)
      api.interceptors.response.eject(responseInterceptor)
    }
  }, [accessToken])

  // Check authentication status on app start
  const checkAuth = async () => {
    try {
      console.log("CheckAuth: Attempting to refresh token...")
      console.log("CheckAuth: Current cookies:", document.cookie)
      
      // Try to refresh token first (this handles page refresh scenario)
      const refreshResponse = await api.post("/api/auth/refresh")
      
      console.log("CheckAuth: Refresh response:", refreshResponse.status)
      console.log("CheckAuth: Refresh data:", refreshResponse.data)
      
      if (refreshResponse.data?.accessToken) {
        // Set the access token
        const newAccessToken = refreshResponse.data.accessToken
        setAccessToken(newAccessToken)
        
        console.log("CheckAuth: New access token set, getting user info...")
        
        // Get user info with explicit authorization header
        const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL!}api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${newAccessToken}`
          },
          withCredentials: true
        })
        
        console.log("CheckAuth: User response:", userResponse.data)
        
        if (userResponse.data && userResponse.data.user) {
          // Transform the JWT payload to match our User interface
          const jwtUser = userResponse.data.user
          const transformedUser: User = {
            _id: jwtUser.sub,
            email: jwtUser.email,
            firstName: "", // JWT doesn't include names
            lastName: "",
            position: jwtUser.role,
            createdAt: "",
            updatedAt: ""
          }
          setUser(transformedUser)
          console.log("CheckAuth: User set successfully")
        }
      } else {
        console.log("CheckAuth: No access token in refresh response")
      }
    } catch (error: any) {
      console.log("CheckAuth: Error details:", error.response?.status, error.response?.data)
      console.log("CheckAuth: Full error:", error)
      console.log("CheckAuth: Not authenticated or session expired")
      setUser(null)
      setAccessToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting login with:", email)

      const response = await api.post("/api/auth/login", {
        email,
        password,
      })

      console.log("Login response:", response.status)
      console.log("Login response data:", response.data)

      if (response.data && response.data.user && response.data.accessToken) {
        console.log("Login successful, user data:", response.data.user)
        console.log("Access token received:", response.data.accessToken.substring(0, 20) + "...")
        
        // Store user data from login response (has full user info)
        setUser(response.data.user)
        
        // Store access token in memory only
        setAccessToken(response.data.accessToken)
        
        console.log("User and token set in state")
        return true
      } else {
        console.log("Login failed: No user data or access token")
        console.log("Response structure:", response.data)
        return false
      }
    } catch (error: any) {
      const apiError = handleApiError(error)
      console.error("Login error:", apiError.message)
      console.error("Full error:", error.response?.data)
      return false
    }
  }

  const logout = async () => {
    try {
      await api.post("/api/auth/logout")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      setAccessToken(null)
      
      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, checkAuth, accessToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
