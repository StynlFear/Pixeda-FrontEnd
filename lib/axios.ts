// lib/axios.ts
import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000",
  withCredentials: true, // Important for sending HTTP-only refresh token cookies
})

// We'll set up the token attachment in the auth context
// since we need access to the React state

export default api
