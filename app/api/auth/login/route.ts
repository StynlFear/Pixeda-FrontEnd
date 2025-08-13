import { type NextRequest, NextResponse } from "next/server"

// Mock users - replace with your API call
const mockUsers = [
  {
    id: "1",
    email: "admin@pixeda.ro",
    firstName: "Admin",
    lastName: "User",
    role: "ADMIN",
    position: "ADMIN",
    password: "secret123", // Using plain text for demo - replace with your API
    isActive: true,
  },
  {
    id: "2",
    email: "employee@pixeda.ro",
    firstName: "John",
    lastName: "Doe",
    role: "EMPLOYEE",
    position: "EMPLOYEE",
    password: "secret123", // Using plain text for demo - replace with your API
    isActive: true,
  },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log("Login attempt:", { email, password: "***" })

    if (!email || !password) {
      console.log("Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user - replace this with your API call
    const user = mockUsers.find((u) => u.email === email && u.isActive)
    console.log("User found:", user ? "Yes" : "No")

    if (!user) {
      console.log("User not found or inactive")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password - replace this with your API call
    const isPasswordValid = password === user.password
    console.log("Password valid:", isPasswordValid)

    if (!isPasswordValid) {
      console.log("Invalid password")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate token - replace with your JWT implementation
    const token = `mock-token-${user.id}-${Date.now()}`

    const userData = {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      position: user.position,
    }

    console.log("Login successful for:", userData.email)

    return NextResponse.json({
      user: userData,
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
