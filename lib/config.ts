// Configuration for API endpoints and authentication
export const config = {
  // Backend API base URL - requires NEXT_PUBLIC_API_BASE_URL environment variable
  apiBaseURL: process.env.NEXT_PUBLIC_API_BASE_URL!,
  
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
