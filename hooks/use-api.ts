"use client"

import { useAuth } from "@/lib/auth-context"
import { useCallback } from "react"
import axios, { AxiosRequestConfig } from "axios"

const baseAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true,
})

export function useAPI() {
  const { accessToken, logout, checkAuth } = useAuth()

  const apiCall = useCallback(async (config: AxiosRequestConfig) => {
    // Add auth token to request if available
    if (accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${accessToken}`
      }
    }

    try {
      return await baseAPI(config)
    } catch (error: any) {
      // Handle 401 - token expired
      if (error.response?.status === 401 && accessToken) {
        try {
          // Try to refresh token using HTTP-only cookie
          const refreshResponse = await baseAPI.post("/auth/refresh")
          
          if (refreshResponse.data?.accessToken) {
            // Update the auth context with new token
            await checkAuth()
            
            // Retry original request with new token
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${refreshResponse.data.accessToken}`
            }
            return await baseAPI(config)
          }
        } catch (refreshError) {
          // Refresh failed, logout user
          console.log("Token refresh failed, logging out")
          await logout()
          throw refreshError
        }
      }
      
      throw error
    }
  }, [accessToken, logout, checkAuth])

  const api = {
    get: (url: string, config?: AxiosRequestConfig) => 
      apiCall({ ...config, method: 'GET', url }),
    
    post: (url: string, data?: any, config?: AxiosRequestConfig) => 
      apiCall({ ...config, method: 'POST', url, data }),
    
    put: (url: string, data?: any, config?: AxiosRequestConfig) => 
      apiCall({ ...config, method: 'PUT', url, data }),
    
    delete: (url: string, config?: AxiosRequestConfig) => 
      apiCall({ ...config, method: 'DELETE', url }),
    
    patch: (url: string, data?: any, config?: AxiosRequestConfig) => 
      apiCall({ ...config, method: 'PATCH', url, data }),
  }

  return api
}
