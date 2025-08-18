// Configuration for API endpoints and authentication
export const config = {
  // Backend API base URL - update this to match your backend
  apiBaseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
  
  // Authentication endpoints
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh", 
    logout: "/auth/logout",
    me: "/auth/me"
  },
  
  // Other API endpoints
  endpoints: {
    clients: "/clients",
    companies: "/companies", 
    employees: "/employees",
    products: "/products",
    orders: "/orders"
  }
}

export default config
